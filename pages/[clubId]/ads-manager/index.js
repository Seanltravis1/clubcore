import Layout from '@/components/Layout';
import { withClubAuth } from '@/utils/withClubAuth';

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if ('redirect' in result) return result;
  const { user, clubUser, clubId } = result.props;
  return { props: { user, clubUser, clubId } };
};

export default function Page({ clubId }) {
  return (
    <Layout>
      <h1>📄 {clubId} — Ads-manager PAGE</h1>
      <p>This is a placeholder for the module page.</p>
    </Layout>
  );
}
