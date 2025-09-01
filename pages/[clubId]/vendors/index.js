import { useState } from "react";
import Layout from "@/components/Layout";
import HomeButton from "@/components/HomeButton";
import AdSpace from "@/components/AdSpace";
import Button from "@/components/Button";
import Link from "next/link";
import hasAccess from "@/utils/hasAccess";
import { withClubAuth } from "@/utils/withClubAuth";
import { getServerSupabase } from "@/lib/supabaseServer";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Helper: get unique products by name, keep latest price with full date
function getUniqueProducts(products = []) {
  const map = new Map();
  products.forEach((p) => {
    const key = p.name.toLowerCase();
    const current = map.get(key);

    const pDate = new Date(
      p.year || 1900,
      (p.month !== undefined ? p.month - 1 : 0),
      p.day || 1
    );

    if (!current) {
      map.set(key, p);
    } else {
      const currentDate = new Date(
        current.year || 1900,
        (current.month !== undefined ? current.month - 1 : 0),
        current.day || 1
      );
      if (pDate > currentDate) {
        map.set(key, p);
      }
    }
  });
  return Array.from(map.values());
}

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if (!result) return { notFound: true };
  if ("redirect" in result) return result;

  const { clubId } = result.props;
  const supabase = getServerSupabase(ctx);

  const { data: vendorsRaw } = await supabase
    .from("vendors")
    .select("id, name, contact_info, services_offered")
    .eq("club_id", clubId)
    .order("name");

  const { data: productsRaw } = await supabase
    .from("products")
    .select("id, vendor_id, name, price, year, month, day")
    .eq("club_id", clubId);

  const productsByVendor = {};
  (productsRaw || []).forEach((prod) => {
    if (!productsByVendor[prod.vendor_id]) productsByVendor[prod.vendor_id] = [];
    productsByVendor[prod.vendor_id].push(prod);
  });

  const vendors = (vendorsRaw || []).map((v) => ({
    ...v,
    products: productsByVendor[v.id] || []
  }));

  return {
    props: {
      ...result.props,
      vendors,
    },
  };
};

export default function VendorsPage({ clubId, clubUser, permissions, vendors = [] }) {
    // Block members from this section
  if (clubUser?.role?.toLowerCase() === "member") {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ color: "#d32f2f" }}>🚫 Access Denied</h1>
        <p>You do not have permission to view the Vendor Dashboard.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href={`/${clubId}`}>
            <Button type="outline">🏠 Home</Button>
          </Link>
          <Button type="outline" onClick={() => window.history.back()}>
            ⬅️ Back
          </Button>
        </div>
      </div>
    );
  }
const supabase = createClientComponentClient();
  const [vendorList, setVendorList] = useState(vendors);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  if (!hasAccess(clubUser, permissions, "vendors", "view")) {
    return (
      <Layout>
        <HomeButton clubId={clubId} />
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to view the Vendors Dashboard.</p>
      </Layout>
    );
  }

  const handleDelete = async (vendorId) => {
    if (!window.confirm("Delete this vendor and all its products?")) return;
    setDeleting(vendorId);
    setError("");
    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("id", vendorId)
      .eq("club_id", clubId);

    if (error) {
      setError("Delete failed: " + error.message);
      setDeleting(null);
    } else {
      setVendorList(vendorList.filter((v) => v.id !== vendorId));
      setDeleting(null);
    }
  };

  const formatDate = ({ year, month, day }) => {
    if (!year) return "Unknown date";
    const mm = month ? String(month).padStart(2, "0") : "01";
    const dd = day ? String(day).padStart(2, "0") : "01";
    return `${mm}/${dd}/${year}`;
  };

  return (
    <Layout>
      <HomeButton clubId={clubId} />
      <AdSpace location="vendors" clubId={clubId} />

      <div style={{ maxWidth: 950, margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", margin: "20px 0" }}>📋 Vendors</h1>

        <p>Delete Permission: {hasAccess(clubUser, permissions, "vendors", "delete") ? "Yes" : "No"}</p>

        <Link href={`/${clubId}/vendors/new`} legacyBehavior>
          <a>
            <Button type="success" style={{ marginBottom: 24 }}>
              ➕ Add New Vendor
            </Button>
          </a>
        </Link>

        {error && (
          <p style={{ color: "red", marginBottom: 8 }}>{error}</p>
        )}

        {vendorList.length === 0 ? (
          <p>No vendors added yet.</p>
        ) : (
          vendorList.map((vendor) => (
            <div
              key={vendor.id}
              style={{
                marginBottom: 30,
                padding: 24,
                border: "1px solid #ddd",
                borderRadius: 12,
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>{vendor.name}</h2>
                <div>
                  <Link href={`/${clubId}/vendors/${vendor.id}`} legacyBehavior>
                    <a>
                      <Button type="primary" style={{ marginLeft: 10 }}>
                        ✏️ Edit Vendor
                      </Button>
                    </a>
                  </Link>
                  {hasAccess(clubUser, permissions, "vendors", "delete") && (
                    <Button
                      type="danger"
                      style={{ marginLeft: 10, cursor: "pointer" }}
                      onClick={() => handleDelete(vendor.id)}
                      disabled={deleting === vendor.id}
                    >
                      {deleting === vendor.id ? "Deleting..." : "🗑️ Delete"}
                    </Button>
                  )}
                </div>
              </div>

              {(vendor.products && vendor.products.length > 0) ? (
                <ul style={{ marginTop: 12 }}>
                  {getUniqueProducts(vendor.products).map((prod) => (
                    <li key={prod.id}>
                      {prod.name} – ${parseFloat(prod.price).toFixed(2)} ({formatDate(prod)})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#999", marginTop: 10, marginLeft: 4 }}>No products for this vendor.</p>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
