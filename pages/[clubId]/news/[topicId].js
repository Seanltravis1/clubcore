import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import AdSpace from "@/components/AdSpace";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { withClubAuth } from "@/utils/withClubAuth";
import { getServerSupabase } from "@/lib/supabaseServer";

export async function getServerSideProps(ctx) {
  const result = await withClubAuth(ctx);
  if (!result) return { notFound: true };
  if ("redirect" in result) return result;

  const { clubId } = result.props;
  const { topicId } = ctx.query;

  if (!clubId || !topicId) {
    return {
      props: { ...result.props, topic: null, fetchError: "Invalid club or news topic ID." },
    };
  }

  const supabase = getServerSupabase(ctx);
  const { data: topic, error } = await supabase
    .from("club_news")
    .select("id, title, body, created_at, newsletter_path, newsletter_mime, newsletter_name")
    .eq("id", topicId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error || !topic) {
    return {
      props: {
        ...result.props,
        topic: null,
        fetchError: error?.message || "News topic not found.",
      },
    };
  }

  return { props: { ...result.props, topic, fetchError: null } };
}

export default function EditNewsTopicPage({ clubId, topic, fetchError }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [form, setForm] = useState({
    title: topic?.title || "",
    body: topic?.body || "",
  });
  const [error, setError] = useState(fetchError || "");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newsletter, setNewsletter] = useState({
    path: topic?.newsletter_path || "",
    mime: topic?.newsletter_mime || "",
    name: topic?.newsletter_name || "",
  });

  const getPublicUrl = (path) => {
    if (!path) return "";
    const { data } = supabase.storage.from("newsletters").getPublicUrl(path);
    return data?.publicUrl || "";
  };

  if (error || !topic?.id) {
    return (
      <Layout>
        <div style={{ maxWidth: 600, margin: "38px auto", textAlign: "center" }}>
          <h1 style={{ color: "#d32f2f" }}>Edit News Topic</h1>
          <p style={{ color: "#d32f2f" }}>{error || "This news topic was not found. (Check the URL!)"}</p>
          <Link href={`/${clubId}/news`} legacyBehavior>
            <Button type="outline">← Back to News</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadNewsletter = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    // Folder by club/topic for organization
    const filePath = `${clubId}/${topic.id}/${Date.now()}_${file.name}`;

    const { error: upErr } = await supabase.storage.from("newsletters").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    setUploading(false);

    if (upErr) {
      setError("Upload failed: " + upErr.message);
      return;
    }

    setNewsletter({ path: filePath, mime: file.type || "", name: file.name || "" });
  };

  const handleRemoveNewsletter = async () => {
    if (!newsletter.path) return;
    // Optional: delete the file from storage
    await supabase.storage.from("newsletters").remove([newsletter.path]);
    setNewsletter({ path: "", mime: "", name: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.body.trim()) {
      setError("Both a title and body are required.");
      return;
    }

    setSubmitting(true);
    const { error: supabaseError } = await supabase
      .from("club_news")
      .update({
        title: form.title.trim(),
        body: form.body.trim(),
        newsletter_path: newsletter.path || null,
        newsletter_mime: newsletter.mime || null,
        newsletter_name: newsletter.name || null,
      })
      .eq("id", topic.id)
      .eq("club_id", clubId);

    setSubmitting(false);

    if (supabaseError) {
      setError("Update failed: " + supabaseError.message);
    } else {
      router.push(`/${clubId}/news`);
    }
  };

  const publicUrl = newsletter.path ? getPublicUrl(newsletter.path) : "";

  const canPreviewInline = !!newsletter.mime && (newsletter.mime.includes("pdf") || newsletter.mime.startsWith("image/"));

  return (
    <Layout>
      <AdSpace location="news-edit" clubId={clubId} />
      <div
        style={{
          maxWidth: 700,
          margin: "38px auto 0 auto",
          background: "#fff",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 4px 16px #0001",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 12 }}>
          <Link href={`/${clubId}/news`} legacyBehavior>
            <Button type="outline">← Back to News</Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Edit News Topic</h1>
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
              style={{ width: "100%", padding: "10px", fontSize: 18, borderRadius: 8, border: "1px solid #bbb", marginTop: 6 }}
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
                width: "100%", padding: "10px", fontSize: 17,
                borderRadius: 8, border: "1px solid #bbb", marginTop: 6,
                resize: "vertical", minHeight: 110,
              }}
            />
          </div>

          {/* Newsletter upload */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Newsletter (optional)</div>
                <div style={{ color: "#555", fontSize: 14 }}>
                  Upload a PDF or image to show as a full-page newsletter.
                </div>
              </div>
              <label style={{ cursor: "pointer" }}>
                <input type="file" accept="application/pdf,image/*" onChange={handleUploadNewsletter} disabled={uploading} style={{ display: "none" }} />
                <span style={{ border: "1px solid #bbb", padding: "8px 12px", borderRadius: 8 }}>
                  {uploading ? "Uploading…" : "Upload Newsletter"}
                </span>
              </label>
            </div>

            {newsletter.path ? (
              <div style={{ marginTop: 12, background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{newsletter.name || "Newsletter file"}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href={`/${clubId}/news/${topic.id}/newsletter`} legacyBehavior>
                    <Button type="primary">Open Full Page</Button>
                  </Link>
                  {publicUrl && canPreviewInline && (
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <Button type="outline">Open Raw File</Button>
                    </a>
                  )}
                  <Button type="outline" onClick={handleRemoveNewsletter}>Remove</Button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8, color: "#666", fontSize: 14 }}>No newsletter uploaded.</div>
            )}
          </div>

          <Button type="success" disabled={submitting || uploading}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
          {error && <div style={{ color: "red", marginTop: 4 }}>{error}</div>}
        </form>
      </div>
    </Layout>
  );
}
