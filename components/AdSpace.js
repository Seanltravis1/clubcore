// components/AdSpace.jsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdSpace({ location = 'home', clubId, refreshTrigger }) {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratios, setRatios] = useState({}) // { [adId]: number }

  const getPublicUrl = (path) => {
    if (!path) return ''
    const { data } = supabase.storage.from('ads').getPublicUrl(path)
    return data?.publicUrl || ''
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setLoading(true)
      let q = supabase
        .from('ads')
        .select('*')
        .eq('active', true)
        .in('location', [location, 'all'])

      let { data, error } = await q
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error?.message?.toLowerCase().includes('column')) {
        ({ data, error } = await q) // retry without ordering
      }
      if (error) {
        console.error('AdSpace fetch error:', error.message)
        if (isMounted) { setAds([]); setLoading(false) }
        return
      }

      const rows = data || []
      const platformAds = rows.filter(a => a.scope === 'platform')
      const clubAds = clubId
        ? rows.filter(a => (a.scope === 'club' || !a.scope) && a.club_id === clubId)
        : []
      const combined = [...platformAds, ...clubAds].slice(0, 4)

      if (isMounted) { setAds(combined); setLoading(false) }
    })()
    return () => { isMounted = false }
  }, [location, clubId, refreshTrigger])

  const cols = useMemo(() => Math.min(Math.max(ads.length || 1, 1), 4), [ads.length])

  const handleImgLoad = (adId, e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    if (!w || !h) return
    setRatios((r) => ({ ...r, [adId]: w / h }))
  }

  // Decide fit mode: DB override -> heuristic -> default 'contain'
  const fitFor = (ad) => {
    if (ad?.fit === 'cover' || ad?.fit === 'contain') return ad.fit
    const r = ratios[ad.id]
    // Heuristic: very wide looks good as cover; tall/narrow should contain.
    if (r) return r >= 2.2 ? 'cover' : 'contain'
    return 'contain'
  }

  return (
    <div className="ad-wrap">
      <h3 className="title">Our Sponsors</h3>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {loading ? (
          <div className="skeleton" />
        ) : ads.length === 0 ? (
          <p className="empty">No Ads Available</p>
        ) : (
          ads.map((ad) => {
            const src = ad.image?.startsWith('http') ? ad.image : getPublicUrl(ad.image)
            const content = (
              <div className={`ad-slot ${fitFor(ad) === 'contain' ? 'contain' : 'cover'}`}>
                {src ? (
                  <img
                    src={src}
                    alt={ad.title || 'Sponsor Ad'}
                    loading="lazy"
                    onLoad={(e) => handleImgLoad(ad.id, e)}
                  />
                ) : (
                  <div className="fallback">
                    <strong>{ad.title || 'Sponsor'}</strong>
                    {ad.text ? <div className="muted">{ad.text}</div> : null}
                  </div>
                )}
              </div>
            )
            return ad.link ? (
              <a key={ad.id} href={ad.link} target="_blank" rel="noopener noreferrer" className="tile" aria-label={ad.title || 'Sponsor Ad'}>
                {content}
              </a>
            ) : (
              <div key={ad.id} className="tile">{content}</div>
            )
          })
        )}
      </div>

      <style jsx>{`
        .ad-wrap {
          max-width: 860px;
          margin: 1.5rem auto;
          padding: 1rem;
          background: #fdfdfd;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .title {
          margin: 0 0 0.8rem 0;
          text-align: center;
          color: #333;
          font-size: 1.1rem;
        }
        .grid { display: grid; gap: 12px; width: 100%; }
        .empty {
          grid-column: 1 / -1;
          text-align: center;
          color: #aaa;
          margin: 0.5rem 0 0;
        }
        .tile {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden;
          display: block;
          text-decoration: none;
        }
        .ad-slot {
          width: 100%;
          aspect-ratio: 3 / 1;               /* consistent banner frame */
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f7f7;
        }
        /* two fit modes */
        .ad-slot img { width: 100%; height: 100%; display: block; }
        .ad-slot.contain img { object-fit: contain; background: #fff; padding: 6px; }
        .ad-slot.cover img { object-fit: cover; }
        .fallback { padding: 10px; text-align: center; }
        .muted { color: #666; font-size: 0.9rem; margin-top: 4px; }
        .skeleton {
          grid-column: 1 / -1;
          height: 90px;
          background: linear-gradient(90deg, #eee, #f5f5f5, #eee);
          border-radius: 10px;
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>
    </div>
  )
}
