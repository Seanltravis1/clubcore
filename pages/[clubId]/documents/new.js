import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Button from '@/components/Button';
import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import { supabase } from '@/lib/supabase';
import hasAccess from '@/utils/hasAccess';

const categories = [
  'Board Meeting Notes', 'Membership Meeting Notes', 'Event Committee Notes',
  'Building Committee Notes', 'Finance Reports', 'Other',
];
const accessLevels = ['All Members', 'Board Only', 'Admins Only'];

export { getServerSideProps } from '@/utils/withClubAuth'; // SSR injects props

export default function NewDocumentPage({ clubUser, permissions, clubId }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [access, setAccess] = useState('');
  const [file, setFile] = useState(null);
  const [documentDate, setDocumentDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const effectiveClubId = clubId || router.query.clubId;

  if (!effectiveClubId || effectiveClubId === 'undefined') {
    return (
      <Layout>
        <div style={{ padding: '2rem' }}>
          <h1 style={{ color: 'red' }}>Error: Invalid club. Please go back and try again.</h1>
        </div>
      </Layout>
    );
  }

  if (!hasAccess(clubUser, permissions, 'documents', 'add')) {
    return (
      <Layout>
        <AdSpace location="documents" clubId={effectiveClubId} />
        <div style={{ padding: '2rem' }}>
          <h1 style={{ color: 'red' }}>🚫 Access Denied</h1>
          <p>You do not have permission to upload documents.</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <Link href={`/${effectiveClubId}`} legacyBehavior>
              <a><button>🏠 Home</button></a>
            </Link>
            <button onClick={() => window.history.back()}>⬅️ Back</button>
          </div>
        </div>
      </Layout>
    );
  }

  async function handleUpload(e) {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    setSaving(true);

    if (!name || !category || !access || !file || !documentDate) {
      setFormError('Please complete all fields and choose a file.');
      setSaving(false);
      return;
    }
    const filePath = `${effectiveClubId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
    if (uploadError) {
      setFormError('File upload failed: ' + uploadError.message);
      setSaving(false);
      return;
    }
    const { error: insertError } = await supabase
      .from('documents')
      .insert([{
        name,
        category,
        access,
        document_date: documentDate,
        filepath: filePath,
        club_id: effectiveClubId
      }]);
    if (insertError) {
      setFormError('Database insert failed: ' + insertError.message);
      setSaving(false);
      return;
    }
    setSuccess('Document uploaded!');
    setSaving(false);
    setTimeout(() => router.push(`/${effectiveClubId}/documents`), 800);
  }

  return (
    <Layout>
      <AdSpace location="documents" clubId={effectiveClubId} />
      <div style={{
        padding: '2rem',
        maxWidth: '520px',
        margin: '0 auto',
        fontSize: 18,
        lineHeight: 1.5,
      }}>
        <Link href={`/${effectiveClubId}/documents`}>
          <Button type="outline" style={{ fontSize: 17, padding: '10px 20px' }}>
            ⬅️ Back to Documents
          </Button>
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: 28, fontWeight: 700 }}>
          Upload New Document
        </h1>
        <form onSubmit={handleUpload} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            <label style={{ fontWeight: 600, fontSize: 18 }}>Choose File:</label><br />
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              style={{
                fontSize: 16,
                marginTop: 8
              }}
              required
            />
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
              {saving ? "Saving..." : "✅ Save Document"}
            </Button>
            <Link href={`/${effectiveClubId}/documents`}>
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
