// components/AdBanner.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const RATIO_W = 3;
const RATIO_H = 1;

export default function AdBanner({
  clubId,
  location = "home",
  limit = 4
}) {
  const [ads, setAds] = useState([]);

  const getPublicUrl = (path) => {
    if (!path) return "";
    const { data } = supabase.storage.from("ads").getPublicUrl(path);
    return data?.publicUrl || "";
  };

  useEffect(() => {
    if (!clubId) return;

    let isMounted = true;

    (async () => {
      // Base query: active ads for the target location OR 'all'
      let q = supabase
        .from("ads")
        .select("*")
        .eq("active", true)
        .in("location", [location, "all"]);

      // Try safe ordering by sort_order then created_at; fall back if missing
      let { data, error } = await q
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error?.message?.toLowerCase().includes("column")) {
        // Retry without ordering if columns don't exist yet
        ({ data, error } = await q);
      }

      if (error) {
        console.error("AdBanner fetch error:", error.message);
        if (isMounted) setAds([]);
        return;
      }

      const rows = data || [];

      // Optional: prioritize platform vs club scope (keeps behavior consistent with AdSpace)
      const platformAds = rows.filter(a => a.scope === "platform");
      const clubAds = rows.filter(a => a.scope !== "platform" && a.club_id === clubId);

      // Combine & limit
      const combined = [...platformAds, ...clubAds].slice(0, limit);

      if (isMounted) setAds(combined);
    })();

    return () => { isMounted = false; };
  }, [clubId, location, limit]);

  if (!ads.length) return null;

  return (
    <>
      <style jsx>{`
        .ad-banner {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .tile {
          display: block;
          text-decoration: none;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          overflow: hidden;
        }
        .ad-slot {
          width: 100%;
          aspect-ratio: ${RATIO_W} / ${RATIO_H};
          background: #f7f7f7;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ad-slot img {
          width: 100%;
          height: 100%;
          object-fit: contain; /* preserve aspect ratio, no distortion */
          display: block;
        }
        .fallback {
          padding: 10px;
          text-align: center;
          color: #555;
        }
      `}</style>

      <div className="ad-banner">
        {ads.map((ad) => {
          const src = ad.image?.startsWith("http") ? ad.image : getPublicUrl(ad.image);
          const body = (
            <div className="ad-slot">
              {src ? (
                <img src={src} alt={ad.title || "Sponsor Ad"} loading="lazy" />
              ) : (
                <div className="fallback">
                  <strong>{ad.title || "Sponsor"}</strong>
                  {ad.text ? <div>{ad.text}</div> : null}
                </div>
              )}
            </div>
          );

          return ad.link ? (
            <a key={ad.id} className="tile" href={ad.link} target="_blank" rel="noopener noreferrer" aria-label={ad.title || "Sponsor Ad"}>
              {body}
            </a>
          ) : (
            <div key={ad.id} className="tile">{body}</div>
          );
        })}
      </div>
    </>
  );
}
