import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import { supabase } from '@/lib/supabase';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';
import hasAccess from '@/utils/hasAccess';

const categories = [
  'Board Meeting Notes', 'Membership Meeting Notes', 'Event Committee Notes',
  'Building Committee Notes', 'Finance Reports', 'Other',
];
const accessLevels = ['All Members', 'Board Only', 'Admins Only'];

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if ('redirect' in result) return result;

  const { clubId } = result.props;
  const { id } = ctx.params;
  const supabase = getServerSupabase(ctx);

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('club_id', clubId)
    .single();

  if (error || !doc) {
    return {
      props: { ...result.props, error: error?.message || 'Document not found', doc: null }
    };
  }

  return {
    props: { ...result.props, doc }
  };
};

export default function EditDocumentPage({ clubId, clubUser, permissions, doc, error }) {
  const router = useRouter();
  const [name, setName] = useState(doc?.name || '');
  const [category, setCategory] = useState(doc?.category || '');
  const [access, setAccess] = useState(doc?.access || '');
  const [file, setFile] = useState(null);
  const [documentDate, setDocumentDate] = useState(doc?.document_date ? doc.document_date.substring(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  if (error) {
    return (
      <Layout>
        <AdSpace location="documents" clubId={clubId} />
        <h1>Edit Document</h1>
        <div style={{ color: 'red', margin: 16, fontSize: 18 }}>{error}</div>
        <Link href={`/${clubId}/documents`}>
          <Button type="outline">⬅️ Back to Documents</Button>
        </Link>
      </Layout>
    );
  }

  if (!hasAccess(clubUser, permissions, 'documents', 'edit')) {
    return (
      <Layout>
        <AdSpace location="documents" clubId={clubId} />
        <h1>Edit Document</h1>
        <div style={{ color: 'red', margin: 16, fontSize: 18 }}>You do not have permission to edit documents.</div>
        <Link href={`/${clubId}/documents`}>
          <Button type="outline">⬅️ Back to Documents</Button>
        </Link>
      </Layout>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    setSaving(true);

    if (!name || !category || !access || !documentDate) {
      setFormError('Please fill out all fields (except file, which is optional).');
      setSaving(false);
      return;
    }

    let updatedFields = {
      name,
      category,
      access,
      document_date: documentDate,
    };

    if (file) {
      const filePath = `${clubId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file);
      if (uploadError) {
        setFormError('File upload failed: ' + uploadError.message);
        setSaving(false);
        return;
      }
      updatedFields.filepath = filePath;
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update(updatedFields)
      .eq('id', doc.id)
      .eq('club_id', clubId);

    if (updateError) {
      setFormError('Update failed: ' + updateError.message);
      setSaving(false);
    } else {
      setSuccess('Document updated!');
      setSaving(false);
      setTimeout(() => router.push(`/${clubId}/documents`), 800); // Optional: auto-redirect
    }
  }

  return (
    <Layout>
      <AdSpace location="documents" clubId={clubId} />
      <div style={{
        padding: '2rem',
        maxWidth: '520px',
        margin: '0 auto',
        fontSize: 18,
        lineHeight: 1.5,
      }}>
        <Link href={`/${clubId}/documents`}>
          <Button type="outline" style={{ fontSize: 17, padding: '10px 20px' }}>
            ⬅️ Back to Documents
          </Button>
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: 28, fontWeight: 700 }}>
          Edit Document
        </h1>
        <form onSubmit={handleSave} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: 18 }}>Name:</label><br />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                fontSize: 18,
                padding: '12px 10px',
                borderRadius: 7,
                border: '1px solid #ccc',
                marginTop: 4
              }}
              required
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 18 }}>Document Date:</label><br />
            <input
              type="date"
              value={documentDate}
              onChange={e => setDocumentDate(e.target.value)}
              style={{
                width: '100%',
                fontSize: 18,
                padding: '12px 10px',
                borderRadius: 7,
                border: '1px solid #ccc',
                marginTop: 4
              }}
              required
            />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 18 }}>Category:</label><br />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                width: '100%',
                fontSize: 18,
                padding: '12px 10px',
                borderRadius: 7,
                border: '1px solid #ccc',
                marginTop: 4
              }}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 18 }}>Access Level:</label><br />
            <select
              value={access}
              onChange={e => setAccess(e.target.value)}
              style={{
                width: '100%',
                fontSize: 18,
                padding: '12px 10px',
                borderRadius: 7,
                border: '1px solid #ccc',
                marginTop: 4
              }}
              required
            >
              <option value="">Select Access Level</option>
              {accessLevels.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 18 }}>Replace File (optional):</label><br />
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              style={{
                fontSize: 16,
                marginTop: 8
              }}
            />
            <div style={{ fontSize: 16, marginTop: 6, color: '#555' }}>
              Current file:{' '}
              <a
                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${doc.filepath}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline', color: '#4f46e5', fontSize: 16 }}
              >
                {doc.name}
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
            <Button
              type="success"
              disabled={saving}
              style={{
                fontSize: 19,
                fontWeight: 700,
                padding: '12px 22px',
                borderRadius: 7
              }}
            >
              {saving ? "Saving..." : "💾 Save Changes"}
            </Button>
            <Link href={`/${clubId}/documents`}>
              <Button type="outline" style={{ fontSize: 17, padding: '10px 20px' }}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
        {formError && <div style={{ color: 'red', marginTop: 12, fontSize: 16 }}>{formError}</div>}
        {success && <div style={{ color: 'green', marginTop: 12, fontSize: 16 }}>{success}</div>}
      </div>
    </Layout>
  );
}
