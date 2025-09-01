// pages/checkout.js
import Layout from '@components/Layout';
import AdSpace from '@components/AdSpace';
import CheckoutButton from '@components/CheckoutButton';

export default function CheckoutPage() {
  return (
    <Layout>
      <h1 style={{ marginBottom: '1rem' }}>💳 ClubCore Checkout</h1>

      <p style={{ marginBottom: '2rem' }}>
        Subscribe to unlock full access to your club dashboard.
      </p>

      <AdSpace location="checkout" />

      <div style={{ marginTop: '2rem' }}>
        <CheckoutButton />
      </div>
    </Layout>
  );
}
