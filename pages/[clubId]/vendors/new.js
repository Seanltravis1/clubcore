import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import Button from "@/components/Button";
import AdSpace from "@/components/AdSpace";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function NewVendorPage() {
  const router = useRouter();
  const { clubId } = router.query;
  const supabase = createClientComponentClient();

  const [vendor, setVendor] = useState({
    name: "",
    contact_info: null,
    services_offered: [],
    products: [],
  });

  const [product, setProduct] = useState({
    name: "",
    price: "",
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format for input type="date"
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (clubId) setReady(true);
  }, [clubId]);

  const handleProductAdd = (e) => {
    e.preventDefault();
    if (!product.name || !product.price || !product.date) return;
    setVendor((prev) => ({
      ...prev,
      products: [...prev.products, { ...product, id: uuidv4() }],
    }));
    setProduct({
      name: "",
      price: "",
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clubId || !vendor.name) {
      setError("Vendor name and club ID are required.");
      return;
    }
    if (vendor.products.length === 0) {
      setError("Please add at least one product.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      // Insert vendor
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .insert([
          {
            club_id: clubId,
            name: vendor.name,
            contact_info: vendor.contact_info || null,
            services_offered: vendor.services_offered || [],
          },
        ])
        .select()
        .single();

      if (vendorError || !vendorData) throw new Error(vendorError?.message || "Vendor insert failed.");

      // Insert products with full date saved in 'date' field
      const productsToInsert = vendor.products.map((p) => ({
        vendor_id: vendorData.id,
        club_id: clubId,
        name: p.name,
        price: parseFloat(p.price),
        date: p.date, // store full date YYYY-MM-DD
      }));

      const { error: prodError } = await supabase.from("products").insert(productsToInsert);

      if (prodError) throw new Error(prodError.message);

      // Redirect on success
      router.push(`/${clubId}/vendors`);
    } catch (err) {
      setError(err.message || "Error saving vendor");
      setSaving(false);
    }
  };

  if (!ready) return null;

  return (
    <Layout>
      <Link href={`/${clubId}/vendors`} legacyBehavior>
        <a>
          <Button type="outline">⬅️ Back to Vendors</Button>
        </a>
      </Link>

      <AdSpace location="vendors" clubId={clubId} />

      <h1>➕ Add New Vendor</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, maxWidth: 600 }}>
        <input
          type="text"
          placeholder="Vendor Name"
          value={vendor.name}
          onChange={(e) => setVendor({ ...vendor, name: e.target.value })}
          style={{ display: "block", marginBottom: 10, padding: 8, width: "100%" }}
          required
        />

        {/* Products Section */}
        <div style={{ marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Product Name"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            style={{ marginRight: 10 }}
            required
          />
          <input
            type="number"
            placeholder="Price"
            min="0"
            step="0.01"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
            style={{ marginRight: 10, width: 100 }}
            required
          />
          <input
            type="date"
            value={product.date}
            onChange={(e) => setProduct({ ...product, date: e.target.value })}
            style={{ marginRight: 10 }}
            required
          />
          <Button
            type="primary"
            
            onClick={handleProductAdd}
            style={{ fontSize: 13, padding: "4px 10px", marginTop: -2 }}
          >
            ➕ Add Product
          </Button>
        </div>

        {/* Product List */}
        <ul style={{ marginTop: 20, marginBottom: 20 }}>
          {vendor.products.map((p) => (
            <li key={p.id}>
              {p.name} - ${parseFloat(p.price).toFixed(2)} ({p.date})
            </li>
          ))}
        </ul>

        {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}
        <Button type="success" style={{ marginTop: 10 }} disabled={saving}>
          {saving ? "Saving..." : "✅ Save Vendor"}
        </Button>
      </form>
    </Layout>
  );
}
