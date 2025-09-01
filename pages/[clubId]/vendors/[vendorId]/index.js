import { useState } from "react";
import Layout from "@/components/Layout";
import HomeButton from "@/components/HomeButton";
import AdSpace from "@/components/AdSpace";
import Button from "@/components/Button";
import Link from "next/link";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { withClubAuth } from "@/utils/withClubAuth";
import { getServerSupabase } from "@/lib/supabaseServer";
import hasAccess from "@/utils/hasAccess";

// Utility function to safely calculate price change percentage
export function calculatePriceChange(current, previous) {
  if (current == null || previous == null) return null;
  if (typeof current !== "number" || typeof previous !== "number") return null;
  if (previous === 0) return null; // prevent division by zero
  return ((current - previous) / previous) * 100;
}

// Server-side fetching of vendor and products
export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if (!result) return { notFound: true };
  if ("redirect" in result) return result;

  const { clubId, vendorId } = ctx.query;
  const supabase = getServerSupabase(ctx);

  const { data: vendor, error: vendorErr } = await supabase
    .from("vendors")
    .select("id, name, contact_info, services_offered")
    .eq("club_id", clubId)
    .eq("id", vendorId)
    .single();

  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, price, year, month, day")
    .eq("vendor_id", vendorId)
    .eq("club_id", clubId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("day", { ascending: false });

  if (!vendor) return { notFound: true };

  return {
    props: {
      ...result.props,
      vendor,
      products: products || [],
    },
  };
};

export default function EditVendorPage({
  clubId,
  clubUser,
  permissions,
  vendor,
  products = [],
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [editName, setEditName] = useState(vendor.name || "");
  const [savingVendor, setSavingVendor] = useState(false);
  const [vendorMsg, setVendorMsg] = useState("");

  const [product, setProduct] = useState({
    name: "",
    price: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  });
  const [addingProduct, setAddingProduct] = useState(false);
  const [prodMsg, setProdMsg] = useState("");
  // All products from DB + newly added products
  const [currentProducts, setCurrentProducts] = useState(products);

  // Control showing/hiding previous product entries
  const [showPrevious, setShowPrevious] = useState(false);

  if (!hasAccess(clubUser, permissions, "vendors", "edit")) {
    return (
      <Layout>
        <HomeButton clubId={clubId} />
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to edit this vendor.</p>
      </Layout>
    );
  }

  // Save vendor name changes
  const handleVendorSave = async (e) => {
    e.preventDefault();
    setSavingVendor(true);
    setVendorMsg("");
    const { error } = await supabase
      .from("vendors")
      .update({ name: editName })
      .eq("id", vendor.id)
      .eq("club_id", clubId);

    if (error) setVendorMsg("Error saving vendor: " + error.message);
    else setVendorMsg("Vendor updated!");
    setSavingVendor(false);
  };

  // Add new product (adds to trend and currentProducts)
  const handleProductAdd = async (e) => {
    e.preventDefault();
    setAddingProduct(true);
    setProdMsg("");
    if (!product.name || !product.price) {
      setProdMsg("Product name & price required");
      setAddingProduct(false);
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          vendor_id: vendor.id,
          club_id: clubId,
          name: product.name,
          price: product.price,
          year: product.year,
          month: product.month,
          day: product.day,
        },
      ])
      .select();

    if (error) {
      setProdMsg("Error adding product: " + error.message);
    } else {
      setProdMsg("Product added!");
      setCurrentProducts([data[0], ...currentProducts]);
      setProduct({
        name: "",
        price: "",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
      });
    }
    setAddingProduct(false);
  };

  // Delete product handler
  const handleProductDelete = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("vendor_id", vendor.id)
      .eq("club_id", clubId);

    setCurrentProducts(currentProducts.filter((p) => p.id !== productId));
  };

  // Build price trend data keyed by ISO date string
  const buildTrendData = () => {
    const trend = {};
    currentProducts.forEach(({ name, price, year, month, day }) => {
      if (!trend[name]) trend[name] = {};
      const safeYear = year ?? 0;
      const safeMonth = month ?? 0;
      const safeDay = day ?? 0;
      const dateKey = `${safeYear
        .toString()
        .padStart(4, "0")}-${safeMonth
        .toString()
        .padStart(2, "0")}-${safeDay.toString().padStart(2, "0")}`;
      trend[name][dateKey] = parseFloat(price);
    });
    return trend;
  };

  const trend = buildTrendData();

  // Extract recent and previous products (sorted descending by date)
  const sortedProducts = [...currentProducts].sort((a, b) => {
    // Compare year, month, day descending
    if (b.year !== a.year) return b.year - a.year;
    if (b.month !== a.month) return b.month - a.month;
    return b.day - a.day;
  });

  // Group products by name to split recent and previous entries
  const groupedByName = {};
  sortedProducts.forEach((p) => {
    if (!groupedByName[p.name]) groupedByName[p.name] = [];
    groupedByName[p.name].push(p);
  });

  // Helper to render product list with "Previous entries" toggler
  const renderProductList = () => {
    return Object.entries(groupedByName).map(([name, items]) => {
      const recentItems = items.slice(0, 2);
      const previousItems = items.slice(2);

      return (
        <div key={name} style={{ marginBottom: 20 }}>
          <ul style={{ marginLeft: 0, paddingLeft: 0, listStyle: "none" }}>
            {recentItems.map((p) => (
              <li key={p.id} style={{ marginBottom: 6 }}>
                <b>{p.name}</b> – ${parseFloat(p.price).toFixed(2)} ({p.year}-{p.month}-{p.day}){" "}
                <Button
                  type="danger"
                  style={{ marginLeft: 10, fontSize: 12, padding: "2px 8px" }}
                  onClick={() => handleProductDelete(p.id)}
                  
                >
                  🗑️ Delete
                </Button>
              </li>
            ))}
          </ul>

          {previousItems.length > 0 && (
            <>
              <Button
                type="outline"
                style={{ marginTop: 4, marginBottom: 12 }}
                onClick={() => setShowPrevious(!showPrevious)}
              >
                {showPrevious ? "Hide Previous Entries" : `Show Previous Entries (${previousItems.length})`}
              </Button>

              {showPrevious && (
                <ul style={{ marginLeft: 0, paddingLeft: 0, listStyle: "none" }}>
                  {previousItems.map((p) => (
                    <li key={p.id} style={{ marginBottom: 6, opacity: 0.7 }}>
                      <b>{p.name}</b> – ${parseFloat(p.price).toFixed(2)} ({p.year}-{p.month}-{p.day}){" "}
                      <Button
                        type="danger"
                        style={{ marginLeft: 10, fontSize: 12, padding: "2px 8px" }}
                        onClick={() => handleProductDelete(p.id)}
                        
                      >
                        🗑️ Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      );
    });
  };

  return (
    <Layout>
      <Link href={`/${clubId}/vendors`} legacyBehavior>
        <a>
          <Button type="outline">⬅️ Back to Vendors</Button>
        </a>
      </Link>
      <AdSpace location="vendors" clubId={clubId} />

      <h1>Edit Vendor</h1>
      <form onSubmit={handleVendorSave} style={{ marginBottom: "20px", maxWidth: 500 }}>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          style={{ padding: "8px", width: "100%", marginBottom: 8 }}
          required
        />
        <Button type="primary" style={{ marginTop: 8 }} disabled={savingVendor}>
          {savingVendor ? "Saving..." : "💾 Save Vendor"}
        </Button>
        {vendorMsg && (
          <span style={{ marginLeft: 12, color: vendorMsg.includes("Error") ? "red" : "green" }}>
            {vendorMsg}
          </span>
        )}
      </form>

      <h2 style={{ marginTop: 40 }}>Add Product</h2>
      <form onSubmit={handleProductAdd} style={{ marginBottom: 12, maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="productName" style={{ fontWeight: 'bold', marginBottom: 4 }}>Product Name</label>
            <input
              id="productName"
              type="text"
              placeholder="Product Name"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              style={{ minWidth: 120 }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="price" style={{ fontWeight: 'bold', marginBottom: 4 }}>Price</label>
            <input
              id="price"
              type="number"
              placeholder="Price"
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: e.target.value })}
              style={{ width: 90 }}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="year" style={{ fontWeight: 'bold', marginBottom: 4 }}>Year</label>
            <input
              id="year"
              type="number"
              placeholder="Year"
              value={product.year}
              onChange={(e) => setProduct({ ...product, year: e.target.value })}
              style={{ width: 90 }}
              required
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="month" style={{ fontWeight: 'bold', marginBottom: 4 }}>Month</label>
            <input
              id="month"
              type="number"
              placeholder="Month"
              value={product.month}
              onChange={(e) => setProduct({ ...product, month: e.target.value })}
              style={{ width: 60 }}
              required
              min="1"
              max="12"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="day" style={{ fontWeight: 'bold', marginBottom: 4 }}>Day</label>
            <input
              id="day"
              type="number"
              placeholder="Day"
              value={product.day}
              onChange={(e) => setProduct({ ...product, day: e.target.value })}
              style={{ width: 60 }}
              required
              min="1"
              max="31"
            />
          </div>

          <Button type="success"  disabled={addingProduct} style={{ height: '36px', alignSelf: 'flex-end' }}>
            {addingProduct ? "Adding..." : "➕ Add Product"}
          </Button>
        </div>

        {prodMsg && (
          <span style={{ marginLeft: 12, color: prodMsg.includes("Error") ? "red" : "green" }}>
            {prodMsg}
          </span>
        )}
      </form>

      <h2 style={{ marginTop: 40 }}>Products</h2>
      {renderProductList()}

      <h2 style={{ marginTop: 40 }}>Price Trends</h2>
      <ul>
        {(Object.keys(trend) || []).map((name, index) => {
          const dates = Object.keys(trend[name] || {}).sort((a, b) => (a > b ? -1 : 1)); // descending date sort

          const history = [];

          dates.forEach((dateKey, idx) => {
            const currentPrice = trend[name][dateKey];
            const prevDate = dates[idx + 1];
            const prevPrice = prevDate !== undefined ? trend[name][prevDate] : null;

            const change =
              currentPrice != null && prevPrice != null && !isNaN(currentPrice) && !isNaN(prevPrice)
                ? calculatePriceChange(currentPrice, prevPrice)
                : null;

            history.push({ dateKey, price: currentPrice, change });
          });

          return (
            <li key={index} style={{ marginBottom: "15px" }}>
              <strong>{name}</strong>
              <ul style={{ marginLeft: "20px" }}>
                {history.map((entry) => (
                  <li key={entry.dateKey}>
                    {entry.dateKey}: ${entry.price.toFixed(2)}{" "}
                    {entry.change !== null ? (
                      <span style={{ color: entry.change > 0 ? "green" : "red" }}>
                        ({entry.change > 0 ? "+" : ""}
                        {entry.change.toFixed(2)}%)
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </Layout>
  );
}
