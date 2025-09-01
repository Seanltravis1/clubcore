// File: /pages/[clubId]/finance/view/[entryId].js

import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import Link from "next/link";
import AdSpace from "@/components/AdSpace";
import { getServerSupabase } from "@/lib/supabaseServer";
import { withClubAuth } from "@/utils/withClubAuth";

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if (!result) return { notFound: true };
  if ("redirect" in result) return result;

  const { clubId, clubUser, permissions } = result.props;
  const { entryId } = ctx.query;

  const supabase = getServerSupabase(ctx);
  const { data: entry, error } = await supabase
    .from("finance")
    .select("*")
    .eq("club_id", clubId)
    .eq("id", entryId)
    .single();

  if (error || !entry) {
    return {
      props: { error: error?.message || "Entry not found", clubId }
    };
  }

  return {
    props: { clubId, clubUser, permissions, entryId, initialEntry: entry }
  };
};

export default function FinanceViewPage({
  clubId,
  clubUser,
  permissions,
  entryId,
  initialEntry,
  error,
}) {
  const router = useRouter();
  const [entry, setEntry] = useState(initialEntry || {});
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Home/Back button style (standard)
  const navBtn = {
    background: "#eee",
    color: "#111",
    border: "none",
    borderRadius: 12,
    padding: "12px 32px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 18,
    boxShadow: "0 1px 6px #0001",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "background 0.16s",
    textDecoration: "none"  // REMOVE UNDERLINE
  };

  if (error) {
    return (
      <Layout>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 30 }}>
          <Link href="/" legacyBehavior>
            <a style={{ textDecoration: "none" }}>
              <button style={navBtn}>🏠 <span style={{ fontWeight: 700 }}>Home</span></button>
            </a>
          </Link>
          <Link href={`/${clubId}/finance`} legacyBehavior>
            <a style={{ textDecoration: "none" }}>
              <button style={navBtn}>← Back</button>
            </a>
          </Link>
        </div>
        <AdSpace location="finance" />
        <h1>Finance Entry</h1>
        <div style={{ color: "red", margin: 24 }}>Error: {error}</div>
      </Layout>
    );
  }

  const categories = [
    "Bar Sales", "Food Sales", "Rentals", "Donations", "Maintenance",
    "Utilities", "Supplies", "Insurance", "Licensing", "Marketing",
    "Entertainment", "Payroll", "Other",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/${clubId}/finance/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entry, id: entryId }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (!data.success) {
        setFormError(data.error || "Failed to update");
        return;
      }
      setSuccessMsg("Changes saved!");
      setEditing(false);
      setEntry(data.entry || entry);
    } catch (err) {
      setSubmitting(false);
      setFormError("Failed to update");
    }
  };

  return (
    <Layout>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 30 }}>
        <Link href="/" legacyBehavior>
          <a style={{ textDecoration: "none" }}>
            <button style={navBtn}>🏠 <span style={{ fontWeight: 700 }}>Home</span></button>
          </a>
        </Link>
        <Link href={`/${clubId}/finance`} legacyBehavior>
          <a style={{ textDecoration: "none" }}>
            <button style={navBtn}>← Back</button>
          </a>
        </Link>
      </div>
      <AdSpace location="finance" />
      <div
        style={{
          maxWidth: 540,
          margin: "0 auto",
          background: "#fff",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 4px 16px #0001",
        }}
      >
        {editing ? (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="date"
              name="date"
              value={entry.date || ""}
              onChange={handleChange}
              required
            />
            <select
              name="category"
              value={entry.category || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              name="description"
              placeholder="Description"
              value={entry.description || ""}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="amount"
              step="0.01"
              placeholder="$"
              value={entry.amount || ""}
              onChange={handleChange}
              required
            />
            <select
              name="type"
              value={entry.type || "income"}
              onChange={handleChange}
              required
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <div style={{ display: "flex", gap: 10 }}>
              <Button type="success" disabled={submitting}>
                {submitting ? "Saving..." : "💾 Save"}
              </Button>
              <Button
                type="outline"
                onClick={() => {
                  setEditing(false);
                  setEntry(initialEntry);
                  setFormError("");
                }}
              >
                Cancel
              </Button>
            </div>
            {formError && <div style={{ color: "red" }}>{formError}</div>}
            {successMsg && <div style={{ color: "green" }}>{successMsg}</div>}
          </form>
        ) : (
          <div style={{ lineHeight: 2, fontSize: 18, borderTop: "1px solid #ddd", paddingTop: 18 }}>
            <div>
              <strong>Date:</strong> {entry.date}
            </div>
            <div>
              <strong>Category:</strong> {entry.category}
            </div>
            <div>
              <strong>Description:</strong> {entry.description}
            </div>
            <div>
              <strong>Amount:</strong> ${parseFloat(entry.amount).toFixed(2)}
            </div>
            <div>
              <strong>Type:</strong> {entry.type}
            </div>
            <div style={{ marginTop: 20 }}>
              <Button type="outline" onClick={() => setEditing(true)}>✏️ Edit</Button>
            </div>
            {successMsg && <div style={{ color: "green" }}>{successMsg}</div>}
          </div>
        )}
      </div>
    </Layout>
  );
}
