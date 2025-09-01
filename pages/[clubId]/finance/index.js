// File: /pages/[clubId]/finance/index.js

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import HomeButton from "@/components/HomeButton";
import AdSpace from "@/components/AdSpace";
import hasAccess from "@/utils/hasAccess";
import { withClubAuth } from "@/utils/withClubAuth";

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if ("redirect" in result) return result;
  return { props: result.props };
};   
export default function FinancePage({ clubId, clubUser, permissions }) {
    // Block members from this section
  if (clubUser?.role?.toLowerCase() === "member") {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ color: "#d32f2f" }}>🚫 Access Denied</h1>
        <p>You do not have permission to view the Finance Dashboard.</p>
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
const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    date: "",
    category: "",
    description: "",
    amount: "",
    type: "income",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    "Bar Sales", "Food Sales", "Rentals", "Donations", "Maintenance", "Utilities",
    "Supplies", "Insurance", "Licensing", "Marketing", "Entertainment", "Payroll", "Other",
  ];

  useEffect(() => { fetchEntries(); }, [clubId]);

  async function fetchEntries() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/${clubId}/finance/list`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (e) {
      setError("Failed to load entries");
    }
    setLoading(false);
  }

  function getFilteredEntries() {
    return entries.filter((entry) => {
      const [year, month] = entry.date.split("-");
      return (!filterYear || year === filterYear) && (!filterMonth || month === filterMonth);
    });
  }

  function computeReport() {
    const data = getFilteredEntries();
    let income = 0, expense = 0, perCategory = {}, perMonth = {};
    for (const entry of data) {
      const amt = parseFloat(entry.amount) || 0;
      if (entry.type === "income") income += amt;
      else if (entry.type === "expense") expense += amt;
      perCategory[entry.category] = (perCategory[entry.category] || 0) + (entry.type === "income" ? amt : -amt);
      const ym = entry.date.slice(0, 7);
      perMonth[ym] = (perMonth[ym] || 0) + (entry.type === "income" ? amt : -amt);
    }
    return { income, expense, net: income - expense, perCategory, perMonth };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.date || !form.category || !form.description || !form.amount || !form.type) {
      setError("All fields required");
      return;
    }
    try {
      const endpoint = editingId
        ? `/api/${clubId}/finance/update`
        : `/api/${clubId}/finance/create`;
      const method = "POST";
      const body = JSON.stringify(
        editingId ? { ...form, id: editingId } : form
      );
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save");
      await fetchEntries();
      setForm({
        date: "",
        category: "",
        description: "",
        amount: "",
        type: "income",
      });
      setEditingId(null);
    } catch (e) {
      setError(e.message || "Failed to save");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure?")) return;
    setError("");
    try {
      const res = await fetch(`/api/${clubId}/finance/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete");
      await fetchEntries();
    } catch (e) {
      setError(e.message || "Failed to delete");
    }
  }

  function handleEdit(entry) {
    setForm({
      date: entry.date,
      category: entry.category,
      description: entry.description,
      amount: entry.amount,
      type: entry.type,
    });
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setForm({
      date: "",
      category: "",
      description: "",
      amount: "",
      type: "income",
    });
    setEditingId(null);
  }

  function exportCSV() {
    let csv = "Date,Category,Description,Amount,Type\n";
    getFilteredEntries().forEach((entry) => {
      csv += `${entry.date},${entry.category},${entry.description},${entry.amount},${entry.type}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hasAccess(clubUser, permissions, "finance", "view")) {
    return (
      <div>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to view the Finance Dashboard.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      <HomeButton />
      {/* -- FIXED: Pass clubId here -- */}
      <AdSpace location="finance" clubId={clubId} />

      <h1 style={{ marginTop: 6, fontSize: 30, fontWeight: 700, marginBottom: 4 }}>
        <span role="img" aria-label="chart">📊</span> Finance Dashboard
      </h1>

      {/* Add Form */}
      {hasAccess(clubUser, permissions, "finance", "add") && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex", gap: 10, margin: "18px 0",
            background: "#fafbfc", borderRadius: 10, padding: 16, alignItems: "center"
          }}
        >
          <input type="date" name="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          <select name="category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input name="description" placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          <input type="number" name="amount" placeholder="$" value={form.amount} step="0.01" onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
          <select name="type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} required>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <Button type="success">{editingId ? "💾 Update" : "💾 Save"}</Button>
          {editingId && (
            <Button type="outline" onClick={handleCancelEdit} style={{ marginLeft: 4 }}>
              Cancel
            </Button>
          )}
        </form>
      )}

      {/* FILTERS */}
      <div style={{ marginBottom: 12 }}>
        <label>Filter Month:</label>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">All</option>
          {[...Array(12)].map((_, i) =>
            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          )}
        </select>
        <label style={{ marginLeft: 10 }}>Filter Year:</label>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">All</option>
          {[...new Set(entries.map(e => e.date.split('-')[0]))].map(y =>
            <option key={y} value={y}>{y}</option>
          )}
        </select>
        <Button style={{ marginLeft: 10 }} onClick={() => setReport(computeReport())}>Run Report</Button>
        <Button style={{ marginLeft: 10 }} onClick={exportCSV}>Download CSV</Button>
      </div>

      {/* REPORT */}
      {report && (
        <div style={{ background: "#eef", padding: 16, margin: "12px 0", borderRadius: 8 }}>
          <h3>Accounting Report</h3>
          <div>Total Income: <b>${report.income.toFixed(2)}</b></div>
          <div>Total Expenses: <b>${report.expense.toFixed(2)}</b></div>
          <div>Net: <b>${report.net.toFixed(2)}</b></div>
          <div style={{ marginTop: 10 }}>
            <strong>Category Breakdown:</strong>
            <ul>
              {Object.entries(report.perCategory).map(([cat, amt]) =>
                <li key={cat}>{cat}: ${amt.toFixed(2)}</li>
              )}
            </ul>
          </div>
          <div style={{ marginTop: 10 }}>
            <strong>Monthly Net:</strong>
            <ul>
              {Object.entries(report.perMonth).map(([ym, amt]) =>
                <li key={ym}>{ym}: ${amt.toFixed(2)}</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {error && <div style={{ color: "red", margin: "10px 0" }}>{error}</div>}

      <table style={{ width: "100%", marginTop: 20, background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px #0001" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th align="left">Date</th>
            <th align="left">Category</th>
            <th align="left">Description</th>
            <th align="left">Amount</th>
            <th align="left">Type</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={6}>Loading...</td>
            </tr>
          )}
          {!loading && getFilteredEntries().length === 0 && (
            <tr>
              <td colSpan={6}>No entries found.</td>
            </tr>
          )}
          {getFilteredEntries().map((entry) => (
            <tr key={entry.id}>
              <td>{entry.date}</td>
              <td>{entry.category}</td>
              <td>{entry.description}</td>
              <td>${parseFloat(entry.amount).toFixed(2)}</td>
              <td>{entry.type}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <Link href={`/${clubId}/finance/view/${entry.id}`} legacyBehavior>
                  <a>
                    <Button size="sm" style={{ marginRight: 5 }}>👁️ View</Button>
                  </a>
                </Link>
                {hasAccess(clubUser, permissions, "finance", "edit") && (
                  <>
                    <Button
                      type="danger"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >🗑️ Delete</Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
