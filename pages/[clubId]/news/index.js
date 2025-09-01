// pages/[clubId]/news/index.js
import { useState } from "react";
import Layout from "@/components/Layout";
import AdSpace from "@/components/AdSpace";
import Button from "@/components/Button";
import Link from "next/link";
import hasAccess from "@/utils/hasAccess";
import { withClubAuth } from "@/utils/withClubAuth";
import { getServerSupabase } from "@/lib/supabaseServer";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if (!result) return { notFound: true };
  if ("redirect" in result) return result;

  const { clubId } = result.props;
  const supabase = getServerSupabase(ctx);

  // ⬇️ include newsletter columns
  const { data: topicsRaw } = await supabase
    .from("club_news")
    .select("id, title, body, created_at, newsletter_path, newsletter_mime, newsletter_name")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  return {
    props: {
      ...result.props,
      topics: topicsRaw || [],
    },
  };
};

export default function NewsPage({ clubId, clubUser, permissions, topics = [] }) {
  const supabase = createClientComponentClient();
  const [newsList, setNewsList] = useState(topics);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  if (!hasAccess(clubUser, permissions, "news", "view")) {
    return (
      <Layout>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to view Club News.</p>
      </Layout>
    );
  }

  const handleDelete = async (topicId) => {
    if (!window.confirm("Delete this news topic?")) return;
    setDeleting(topicId);
    setError("");
    const { error } = await supabase
      .from("club_news")
      .delete()
      .eq("id", topicId)
      .eq("club_id", clubId);

    if (error) {
      setError("Delete failed: " + error.message);
      setDeleting(null);
    } else {
      setNewsList(newsList.filter((t) => t.id !== topicId));
      setDeleting(null);
    }
  };

  return (
    <Layout>
      {/* --- Home button row, top-left only --- */}
      <div style={{
        maxWidth: 950,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: 24,
        marginBottom: 18
      }}>
        <Link href={`/${clubId}`} legacyBehavior>
          <Button type="outline" style={{ fontSize: 19 }}>
            🏠 Home
          </Button>
        </Link>
      </div>

      <AdSpace location="news" clubId={clubId} />

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20
        }}>
          <h1 style={{ fontSize: "2.4rem", display: "flex", alignItems: "center", gap: 10 }}>
            <span role="img" aria-label="news" style={{ fontSize: 32 }}>📰</span>
            Club News
          </h1>
          <Link href={`/${clubId}/news/new`} legacyBehavior>
            <Button type="success">➕ Add Topic</Button>
          </Link>
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: 8 }}>{error}</p>
        )}

        {newsList.length === 0 ? (
          <p>No news topics posted yet.</p>
        ) : (
          newsList.map((topic) => {
            const hasNewsletter = !!topic.newsletter_path;
            return (
              <div
                key={topic.id}
                style={{
                  marginBottom: 30,
                  padding: 22,
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap"
                }}>
                  <h2 style={{ fontWeight: 700, fontSize: "1.3rem" }}>{topic.title}</h2>
                  <div style={{ display: "flex", gap: 10 }}>
                    {hasNewsletter && (
                      <Link href={`/${clubId}/news/${topic.id}/newsletter`} legacyBehavior>
                        <Button type="primary">📄 View Full Page</Button>
                      </Link>
                    )}
                    <Link href={`/${clubId}/news/${topic.id}`} legacyBehavior>
                      <Button type="outline">✏️ Edit</Button>
                    </Link>
                    {hasAccess(clubUser, permissions, "news", "delete") && (
                      <Button
                        type="danger"
                        onClick={() => handleDelete(topic.id)}
                        disabled={deleting === topic.id}
                      >
                        {deleting === topic.id ? "Deleting..." : "🗑️ Delete"}
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 10, color: "#555" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>
                    Posted {new Date(topic.created_at).toLocaleString()}
                  </span>

                  {/* Simple body excerpt */}
                  <div style={{ marginTop: 12, fontSize: 17, whiteSpace: "pre-wrap" }}>
                    {topic.body}
                  </div>

                  {/* Small hint if a file exists */}
                  {hasNewsletter && (
                    <div style={{ marginTop: 10, fontSize: 14, color: "#2563eb" }}>
                      Attached: {topic.newsletter_name || "Newsletter"} &middot; {topic.newsletter_mime || "file"}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}
