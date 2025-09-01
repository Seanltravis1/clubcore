
import { withClubAuth } from "@/utils/withClubAuth";

export const getServerSideProps = async (ctx) => {
  return await withClubAuth(ctx);
};


// pages/vendors/edit/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '..'components/Layout';
import Link from 'next/link';
import hasAccess from '@utils/hasAccess';

export default function EditVendorPage() {
  const router = useRouter();
  const { id } = router.query;
  const [vendor, setVendor] = useState(null);
  const [product, setProduct] = useState({ name: '', price: '', year: new Date().getFullYear() });

  useEffect(() => {
    if (!id) return;
    const saved = JSON.parse(localStorage.getItem('clubcore-vendors')) || {};
    setVendor(saved[id]);
  }, [id]);

  const handleProductAdd = () => {
    setVendor(prev => ({
      ...prev,
      products: [...(prev.products || []), { ...product, id: crypto.randomUUID() }]
    }));
    setProduct({ name: '', price: '', year: new Date().getFullYear() });
  };

  const handleProductRemove = (productId) => {
    setVendor(prev => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId)
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const saved = JSON.parse(localStorage.getItem('clubcore-vendors')) || {};
    saved[id] = vendor;
    localStorage.setItem('clubcore-vendors', JSON.stringify(saved));
    router.push('/vendors');
  };

  if (!hasAccess('vendors', 'edit')) {
    return (
      <Layout>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to edit vendors.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Link href="/" legacyBehavior><a><button>🏠 Home</button></a></Link>
          <button onClick={() => window.history.back()}>⬅️ Back</button>
        </div>
      </Layout>
    );
  }

  if (!vendor) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <Link href="/vendors">
        <button style={{ backgroundColor: '#e6ffed', color: '#15803d', border: '1px solid #15803d', borderRadius: '5px', padding: '8px 16px', marginBottom: '20px' }}>
          ⬅️ Back to Vendors
        </button>
      </Link>
      <h1>📋 Edit Vendor</h1>
      <form onSubmit={handleSave}>
        <input
          type="text"
          placeholder="Vendor Name"
          value={vendor.name}
          onChange={(e) => setVendor({ ...vendor, name: e.target.value })}
          style={{ display: 'block', marginBottom: '10px', width: '100%' }}
        />

        <input
          type="text"
          placeholder="Product Name"
          value={product.name}
          onChange={(e) => setProduct({ ...product, name: e.target.value })}
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          placeholder="Price"
          value={product.price}
          onChange={(e) => setProduct({ ...product, price: e.target.value })}
          style={{ marginRight: '10px' }}
        />
        <input
          type="text"
          placeholder="Year"
          value={product.year}
          onChange={(e) => setProduct({ ...product, year: e.target.value })}
          style={{ marginRight: '10px' }}
        />
        <button type="button" onClick={handleProductAdd}>➕ Add Product</button>

        <ul>
          {(vendor.products || []).map((p) => (
            <li key={p.id}>
              {p.name} - ${p.price} ({p.year})
              <button onClick={() => handleProductRemove(p.id)} style={{ marginLeft: '10px' }}>❌</button>
            </li>
          ))}
        </ul>

        <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          📄 Save Vendor
        </button>
      </form>
    </Layout>
  );
}

