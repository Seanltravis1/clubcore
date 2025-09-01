// components/AdManager.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const LOCATIONS = [
  "events","events/edit","members","members/edit","documents","documents/new",
  "finance","finance/edit","reminders","rentals","rentals/edit","vendors","vendors/edit","home","all"
];

const RATIO_W = 3;
const RATIO_H = 1;
const RECOMMENDED_W = 1200;
const RECOMMENDED_H = 400;

export default function AdManager({ clubId }) {
  const [ads, setAds] = useState([]);
  const [filterLoc, setFilterLoc] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const [newAd, setNewAd] = useState({
    title: "",
    image: "",
    link: "",
    text: "",
    location: "",
    sort_order: 1,   // renamed from "order"
    active: true,
  });

  const getPublicUrl = (path) => {
    if (!path) return "";
    const { data } = supabase.storage.from("ads").getPublicUrl(path);
    return data?.publicUrl || "";
  };

  const fetchAds = async () => {
    if (!clubId) return;
    let q = supabase.from("ads").select("*").eq("club_id", clubId);
    if (filterLoc && filterLoc !== "all") q = q.eq("location", filterLoc);

    // Try safe ordering by sort_order then created_at; fall back if missing
    let { data, error } = await q.order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (error?.message?.toLowerCase().includes("column")) {
      ({ data, error } = await q); // retry without ordering if column doesn't exist yet
    }
    if (error) {
      console.error("AdManager fetch error:", error.message);
      setAds([]);
      return;
    }
    setAds(data || []);
  };

  useEffect(() => {
    fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, filterLoc]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    const filePath = `${clubId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("ads").upload(filePath, file, {
      cacheControl: "86400",
      upsert: false,
    });
    if (error) {
      alert("File upload failed: " + error.message);
      setPreviewUrl("");
    } else {
      setNewAd((prev) => ({ ...prev, image: filePath }));
    }
    setUploading(false);
  };

  const handleAddAd = async (e) => {
    e?.preventDefault?.();
    if (!clubId || uploading) return;
    if (!newAd.location) return alert("Please select a location.");

    setSaving(true);
    const payload = { ...newAd, club_id: clubId };
    const { error } = await supabase.from("ads").insert([payload]);
    setSaving(false);

    if (error) return alert("Failed to add ad: " + error.message);

    setNewAd({
      title: "",
      image: "",
      link: "",
      text: "",
      location: "",
      sort_order: 1,
      active: true,
    });
    setPreviewUrl("");
    fetchAds();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this ad?")) return;
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) return alert("Failed to delete: " + error.message);
    fetchAds();
  };

  const toggleActive = async (ad) => {
    const { error } = await supabase.from("ads").update({ active: !ad.active }).eq("id", ad.id);
    if (error) return alert("Failed to update: " + error.message);
    fetchAds();
  };

  // Simple reorder (swap sort_order with neighbor)
  const move = async (ad, direction) => {
    const list = [...ads];
    const idx = list.findIndex((x) => x.id === ad.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;

    const a = list[idx];
    const b = list[swapIdx];
    const updates = [
      supabase.from("ads").update({ sort_order: b.sort_order ?? b.order ?? 1 }).eq("id", a.id),
      supabase.from("ads").update({ sort_order: a.sort_order ?? a.order ?? 1 }).eq("id", b.id),
    ];
    const [r1, r2] = await Promise.all(updates);
    if (r1.error || r2.error) {
      return alert("Reorder failed: " + (r1.error?.message || r2.error?.message));
    }
    fetchAds();
  };

  const filteredCount = useMemo(() => ads.length, [ads]);

  return (
    <div>
      <style jsx>{`
        .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .ad-slot {
          width: 100%;
          aspect-ratio: ${RATIO_W} / ${RATIO_H};
          background: #f7f7f7;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ad-slot img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .thumb { width: 260px; max-width: 100%; }
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          background: #fafafa;
        }
        .list-item {
          display: grid;
          grid-template-columns: 280px 1fr auto;
          gap: 14px;
          align-items: center;
          border-bottom: 1px solid #eee;
          padding: 12px 0;
        }
        .controls button { margin-right: 8px; }
        .hint { color: #6b7280; font-size: 0.92rem; }
      `}</style>

      <div className="row" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Manage Club Ads</h3>
        <div style={{ marginLeft: "auto" }}>
          <label style={{ marginRight: 8 }}>Filter:</label>
          <select value={filterLoc} onChange={(e) => setFilterLoc(e.target.value)}>
            <option value="all">All locations</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <span style={{ marginLeft: 10, color: "#6b7280" }}>
            {filteredCount} ad{filteredCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Add new */}
      <form onSubmit={handleAddAd} className="card" style={{ marginBottom: 16, maxWidth: 780 }}>
        <div className="row">
          <input
            placeholder="Title"
            value={newAd.title}
            onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
            required
            style={{ flex: 1, height: 42, padding: "0 10px" }}
          />
          <input
            placeholder="Link (optional)"
            value={newAd.link}
            onChange={(e) => setNewAd({ ...newAd, link: e.target.value })}
            style={{ flex: 1, height: 42, padding: "0 10px" }}
          />
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <input
            placeholder="Text (optional)"
            value={newAd.text}
            onChange={(e) => setNewAd({ ...newAd, text: e.target.value })}
            style={{ flex: 2, height: 42, padding: "0 10px" }}
          />
          <select
            required
            value={newAd.location}
            onChange={(e) => setNewAd({ ...newAd, location: e.target.value })}
            style={{ width: 260, height: 42 }}
          >
            <option value="" disabled>Select Location</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Sort order"
            value={newAd.sort_order}
            onChange={(e) => setNewAd({ ...newAd, sort_order: Number(e.target.value) })}
            min={1}
            max={100}
            required
            style={{ width: 130, height: 42, padding: "0 10px" }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Image (optional)</label><br />
          <input type="file" onChange={handleFileUpload} disabled={uploading} />
          <div className="hint">
            Recommended size: <strong>{RECOMMENDED_W}×{RECOMMENDED_H}</strong> (3:1). Images auto-fit without distortion.
          </div>

          {(previewUrl || newAd.image) && (
            <div style={{ marginTop: 10 }}>
              <div className="thumb">
                <div className="ad-slot">
                  <img src={previewUrl || getPublicUrl(newAd.image)} alt="Preview" />
                </div>
              </div>
              <div className="hint" style={{ marginTop: 6 }}>
                This is exactly how it will appear in banners.
              </div>
            </div>
          )}
        </div>

        <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
          <label>
            <input
              type="checkbox"
              checked={newAd.active}
              onChange={(e) => setNewAd({ ...newAd, active: e.target.checked })}
            /> Active
          </label>
          <button type="submit" disabled={saving || uploading} style={{ marginLeft: "auto" }}>
            {saving ? "Adding..." : "Add Ad"}
          </button>
        </div>
      </form>

      {/* Existing list */}
      <div className="card">
        {ads.length === 0 && <div className="hint">No ads yet.</div>}
        {ads.map((ad, idx) => {
          const src = ad.image?.startsWith("http") ? ad.image : getPublicUrl(ad.image);
          return (
            <div key={ad.id} className="list-item">
              <div className="thumb">
                <div className="ad-slot">
                  {src ? <img src={src} alt={ad.title || "Ad"} loading="lazy" /> : null}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600 }}>{ad.title || "Untitled"}</div>
                {ad.text && <div style={{ color: "#4b5563" }}>{ad.text}</div>}
                {ad.link && (
                  <div>
                    <a href={ad.link} target="_blank" rel="noopener noreferrer">{ad.link}</a>
                  </div>
                )}
                <div className="hint">
                  Location: {ad.location || "—"} | Sort: {ad.sort_order ?? "—"} | {ad.active ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="controls">
                <button onClick={() => move(ad, "up")} disabled={idx === 0}>↑</button>
                <button onClick={() => move(ad, "down")} disabled={idx === ads.length - 1}>↓</button>
                <button onClick={() => toggleActive(ad)}>{ad.active ? "Disable" : "Enable"}</button>
                <button onClick={() => handleDelete(ad.id)} style={{ color: "#b91c1c" }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
