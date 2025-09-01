// pages/not-authorized.js
import Layout from '@/components/Layout';

export default function NotAuthorized() {
  return (
    <Layout>
      <div style={{ maxWidth: 420, margin: '80px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, color: '#c00', marginBottom: 18 }}>🚫 Not Authorized</h1>
        <p style={{ fontSize: 18, color: '#444' }}>
          You do not have permission to view this page.<br />
          Please contact your club administrator if you think this is a mistake.
        </p>
      </div>
    </Layout>
  );
}
