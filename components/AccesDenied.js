import Layout from './Layout';

export default function AccessDenied({ section = 'this section' }) {
  return (
    <Layout>
      <h1>🚫 Access Denied</h1>
      <p>You do not have permission to view {section}.</p>
    </Layout>
  );
}
