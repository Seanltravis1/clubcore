// pages/[clubId]/news/[topicId]/newsletter.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewsletterPage() {
  const router = useRouter();
  const { clubId, topicId } = router.query;

  const [fileUrl, setFileUrl] = useState(null);
  const [fileMime, setFileMime] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!clubId || !topicId) return;

    (async () => {
      try {
        // Pull newsletter fields from your club_news table
        const { data, error } = await supabase
          .from('club_news')
          .select('newsletter_path, newsletter_mime, newsletter_name')
          .eq('club_id', clubId)
          .eq('id', topicId)
          .maybeSingle();

        if (error) throw error;
        if (!data || !data.newsletter_path) {
          setErr('No newsletter file is attached to this news item.');
          setLoading(false);
          return;
        }

        const path = data.newsletter_path;
        const mime = data.newsletter_mime || '';
        const name = data.newsletter_name || 'newsletter';

        // Generate public URL from the newsletter bucket (singular)
        const { data: urlData } = supabase
          .storage
          .from('newsletter')
          .getPublicUrl(path);

        if (!urlData?.publicUrl) {
          setErr('Unable to generate a public URL for this file.');
          setLoading(false);
          return;
        }

        setFileUrl(urlData.publicUrl);
        setFileMime(mime);
        setFileName(name);
        setLoading(false);
      } catch (e) {
        setErr(e.message || 'Failed to load newsletter.');
        setLoading(false);
      }
    })();
  }, [clubId, topicId]);

  const isPdf = (fileMime || '').toLowerCase().includes('pdf') ||
                (fileUrl || '').toLowerCase().endsWith('.pdf');

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '16px auto' }}>
        <Link href={`/${clubId}/news`} legacyBehavior>
          <a style={{
            display: 'inline-block',
            padding: '8px 14px',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#fff',
            textDecoration: 'none'
          }}>← Back to News</a>
        </Link>

        <h1 style={{ marginTop: 18 }}>Newsletter</h1>

        {loading && <p>Loading…</p>}
        {err && <p style={{ color: 'red' }}>{err}</p>}

        {!loading && !err && fileUrl && (
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 10 }}>
              <a href={fileUrl} target="_blank" rel="noreferrer">Open in new tab</a>
              {' · '}
              <a href={fileUrl} download={fileName}>Download</a>
            </div>

            {isPdf ? (
              <iframe
                src={fileUrl}
                title="Newsletter PDF"
                style={{ width: '100%', height: '90vh', border: 'none' }}
              />
            ) : (
              <img
                src={fileUrl}
                alt={fileName || 'Newsletter'}
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
