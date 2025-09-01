import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Button from '@/components/Button';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';
import hasAccess from '@/utils/hasAccess';

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if ('redirect' in result) return result;

  const { clubId } = result.props;
  const { id } = ctx.query;
  const supabase = getServerSupabase(ctx);

  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('club_id', clubId)
    .eq('id', id)
    .single();

  if (error || !document) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      clubId,
      document,
      permissions: result.props.permissions,
      clubUser: result.props.clubUser,
    },
  };
};

export default function DocumentDetailPage({ clubId, document, permissions, clubUser }) {
  const router = useRouter();

  if (!hasAccess(clubUser, permissions, 'documents', 'view')) {
    return (
      <Layout>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to view this document.</p>
        <Button onClick={() => window.history.back()}>⬅️ Back</Button>
      </Layout>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${document.name}"?`)) return;

    const supabase = (await import('@/lib/supabase')).supabase;
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.filepath]);

    if (storageError) {
      alert('Failed to delete file from storage.');
      return;
    }

    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', document.id)
      .eq('club_id', clubId);

    if (dbError) {
      alert('Failed to delete document from database.');
      return;
    }

    alert('Document deleted.');
    router.push(`/${clubId}/documents`);
  };

  return (
    <Layout>
      <Link href={`/${clubId}/documents`}>
        <button>← Back to Documents</button>
      </Link>
      <h1>{document.name}</h1>
      <p><strong>Category:</strong> {document.category}</p>
      <p><strong>Access Level:</strong> {document.access}</p>

      <div style={{ marginTop: '1rem' }}>
        <a
          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${document.filepath}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', color: 'blue' }}
        >
          Download File
        </a>
      </div>

      {hasAccess(clubUser, permissions, 'documents', 'edit') && (
        <button
          onClick={handleDelete}
          style={{
            marginTop: '1rem',
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          Delete Document
        </button>
      )}
    </Layout>
  );
}
