// pages/checkout/failure.js
import Layout from 'components/Layout';
import Button from 'components/Button';
import { useRouter } from 'next/router';

export default function CheckoutFailurePage() {
  const router = useRouter();

  return (
    <Layout>
      <h1 style={{ color: 'red' }}>❌ Payment Failed</h1>
      <p style={{ marginBottom: '20px' }}>
        Something went wrong with your payment. Please try again or contact support if the issue persists.
      </p>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button type="outline" onClick={() => router.push('/checkout')}>🔁 Try Again</Button>
        <Button type="primary" onClick={() => router.push('/landing')}>🏠 Return to Landing</Button>
      </div>
    </Layout>
  );
}
