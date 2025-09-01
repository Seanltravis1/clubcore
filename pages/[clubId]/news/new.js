// File: /pages/[clubId]/news/new.js
import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import AdSpace from "@/components/AdSpace";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AddNewsTopicPage() {
  const router = useRouter();
  const { clubId } = router.query;
  const supabase = createClientComponentClient();

  const [form, setForm] = useState({ title: "", body: "" });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.body.trim()) {
      setError("Both a title and body are required.");
      return;
    }

    setSubmitting(true);

    // Optional upload first (if a file was chosen)
    let newsletter_path = null;
    let newsletter_mime = null;
    let newsletter_name = null;

    if (file) {
      try {
        setUploading(true);
        const safeName = file.name.replace(/\s+/g, "_");
        const objectPath = `${clubId}/${Date.now()}_${safeName}`; // e.g. 123/1713633_news.pdf

        const { error: upErr } = await supabase
          .storage
          .from("newsletter")               // <-- bucket must exist (public recommended)
          .upload(objectPath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (upErr) throw upErr;

        newsletter_path = objectPath;
        newsletter_mime = file.type || "application/octet-stream";
        newsletter_name = file.name;
      } catch (err) {
        setError(`Upload failed: ${err.message || err}`);
        setUploading(false);
        setSubmitting(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    // Create the news row with optional file fields
    const { error: supabaseError } = await supabase.from("club_news").insert([{
      club_id: clubId,
      title: form.title.trim(),
      body: form.body.trim(),
      newsletter_path,
      newsletter_mime,
      newsletter_name,
    }]);

    setSubmitting(false);

    if (supabaseError) {
      setError("Error adding news topic: " + supabaseError.message);
    } else {
      router.push(`/${clubId}/news`);
    }
  };

  return (
    <Layout>
      <AdSpace location="news-new" clubId={clubId} />
      <div
        style={{
          maxWidth: 600,
          margin: "38px auto 0 auto",
          background: "#fff",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 4px 16px #0001",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <Link href={`/${clubId}/news`} legacyBehavior>
            <Button type="outline">← Back to News</Button>
          </Link>
          <h1 style={{ margin: 0, marginLeft: 18, fontSize: 26, fontWeight: 700 }}>
            Add News Topic
          </h1>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <label htmlFor="title" style={{ fontWeight: 700, fontSize: 18 }}>Title</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                fontSize: 18,
                borderRadius: 8,
                border: "1px solid #bbb",
                marginTop: 6,
              }}
              placeholder="Enter a headline for your news topic"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="body" style={{ fontWeight: 700, fontSize: 18 }}>News Body</label>
            <textarea
              id="body"
              name="body"
              value={form.body}
              onChange={handleChange}
              required
              rows={6}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: 17,
                borderRadius: 8,
                border: "1px solid #bbb",
                marginTop: 6,
                resize: "vertical",
                minHeight: 110,
              }}
              placeholder="What's happening at your club? Share details here..."
            />
          </div>

          {/* Optional: attach newsletter (PDF or image) */}
          <div>
            <label htmlFor="newsletter" style={{ fontWeight: 700, fontSize: 18 }}>
              Attach Newsletter (optional)
            </label>
            <input
              id="newsletter"
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              style={{ display: "block", marginTop: 8 }}
            />
            <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
              Accepts PDF or images. The “View Full Page” button on the news list will open this file full-screen.
            </div>
            {file && (
              <div style={{ fontSize: 14, marginTop: 6 }}>
                Selected: <strong>{file.name}</strong> ({file.type || "unknown type"})
              </div>
            )}
          </div>

          <Button type="success" disabled={submitting || uploading}>
            {submitting || uploading ? "Saving..." : "Add Topic"}
          </Button>

          {error && <div style={{ color: "red", marginTop: 4 }}>{error}</div>}
        </form>
      </div>
    </Layout>
  );
}
