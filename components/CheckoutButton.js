// components/CheckoutButton.js
import { useState } from 'react';
import Button from './Button';

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Failed to start checkout.');
      setLoading(false);
    }
  };

  return (
    <Button type="primary" onClick={handleClick} disabled={loading}>
      {loading ? 'Redirecting...' : '💳 Subscribe Now'}
    </Button>
  );
}
