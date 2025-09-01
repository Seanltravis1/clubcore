import Link from 'next/link';
import Button from '@/components/Button';
import AdSpace from '@/components/AdSpace';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';
import hasAccess from '@/utils/hasAccess';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if ('redirect' in result) return result;

  const { clubId, clubUser, permissions } = result.props;
  const supabase = getServerSupabase(ctx);

  const { data: docs, error } = await supabase
    .from('documents')
    .select('*')
    .eq('club_id', clubId)
    .order('document_date', { ascending: false });

  if (error) {
    return { props: { ...result.props, docs: [], error: error.message } };
  }

  return {
    props: {
      ...result.props,
      docs: docs || [],
    },
  };
};

export default function DocumentsPage({ docs, clubId, clubUser, permissions, error }) {
    // Block members from this section
  if (clubUser?.role?.toLowerCase() === "member") {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ color: "#d32f2f" }}>🚫 Access Denied</h1>
        <p>You do not have permission to view the Documents Dashboard.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href={`/${clubId}`}>
            <Button type="outline">🏠 Home</Button>
          </Link>
          <Button type="outline" onClick={() => window.history.back()}>
            ⬅️ Back
          </Button>
        </div>
      </div>
    );
  }
const router = useRouter();

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    if (error) {
      alert('Delete failed!');
      console.error(error);
    } else {
      router.replace(router.asPath);
    }
  }

  // Group documents by category
  const groupedDocs = docs.reduce((acc, doc) => {
    const category = doc.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {});

  if (!hasAccess(clubUser, permissions, 'documents', 'view')) {
    return (
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ color: 'red', fontSize: '1.5rem', fontWeight: 'bold' }}>🚫 Access Denied</h1>
        <p>You do not have permission to view the Documents Page.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Link href={`/${clubId}`}>
            <Button type="outline">🏠 Home</Button>
          </Link>
          <Button type="outline" onClick={() => window.history.back()}>
            ⬅️ Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Link href={`/${clubId}`}>
          <Button type="outline">🏠 Home</Button>
        </Link>
        {hasAccess(clubUser, permissions, 'documents', 'add') && (
          <>
            <Link href={`/${clubId}/documents/new`}>
              <Button type="success">➕ Upload New Document</Button>
            </Link>
            <Link href={`/${clubId}/documents/reports`}>
              <Button type="primary">📊 Run Report</Button>
            </Link>
          </>
        )}
      </div>

      <AdSpace location="documents" clubId={clubId} />

      <h1>📁 <b>Club Documents</b></h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {Object.keys(groupedDocs).length === 0 ? (
        <p>No documents found for your access level.</p>
      ) : (
        Object.entries(groupedDocs).map(([category, docs]) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <h2>📂 {category}</h2>
            <ul style={{ padding: 0, listStyle: 'none' }}>
              {docs.map(doc => {
                const docUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${doc.filepath}`;
                return (
                  <li key={doc.id} style={{
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <b>{doc.name}</b>
                      {doc.document_date &&
                        <small style={{ marginLeft: 8, color: '#777' }}>
                          ({new Date(doc.document_date).toLocaleDateString()})
                        </small>
                      }
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        type="primary"
                        size="sm"
                        onClick={() => window.open(docUrl, '_blank')}
                      >
                        👁️ View
                      </Button>
                      <a
                        href={docUrl}
                        download={doc.name}
                        style={{ textDecoration: 'none' }}
                      >
                        <Button type="outline" size="sm">⬇️ Download</Button>
                      </a>
                      {hasAccess(clubUser, permissions, 'documents', 'edit') && (
                        <Link href={`/${clubId}/documents/edit/${doc.id}`} legacyBehavior>
                          <a style={{ textDecoration: 'none' }}>
                            <Button type="success" size="sm">✏️ Edit</Button>
                          </a>
                        </Link>
                      )}
                      {hasAccess(clubUser, permissions, 'documents', 'edit') && (
                        <Button
                          type="danger"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                        >
                          🗑️ Delete
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
