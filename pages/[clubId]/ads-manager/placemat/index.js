// pages/[clubId]/ads-manager/placemat.js
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import AdSpace from '@/components/AdSpace'
import HomeButton from '@/components/HomeButton'
import Button from '@/components/Button'
import { supabase } from '@/lib/supabase'

const MAX_ADS = 18
const PAPER = 'letter' // change to 'legal' if needed (still landscape)

export default function PlacematPage() {
  const router = useRouter()
  const { clubId } = router.query

  const [ads, setAds] = useState([])
  const [checked, setChecked] = useState({})
  const [centerImage, setCenterImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [warn, setWarn] = useState('')
  const [showCenterImageInput, setShowCenterImageInput] = useState(false)

  const getPublicUrl = (path) => {
    if (!path) return ''
    const { data } = supabase.storage.from('ads').getPublicUrl(path)
    return data?.publicUrl || ''
  }

  useEffect(() => {
    if (!clubId) return
    ;(async () => {
      const { data } = await supabase.from('ads').select('*').eq('club_id', clubId)
      setAds(data || [])
      const init = {}
      ;(data || []).forEach(ad => { if (ad.active) init[ad.id] = true })
      setChecked(init)
    })()
  }, [clubId])

  const numChecked = useMemo(() => Object.values(checked).filter(Boolean).length, [checked])

  const handleToggle = (id) => {
    if (!checked[id] && numChecked >= MAX_ADS) {
      setWarn('Maximum of 18 ads per placemat (center reserved).')
      setTimeout(() => setWarn(''), 2000)
      return
    }
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Deterministic perimeter: exactly 18 slots (pad with nulls)
  const picks = (ads || []).filter(a => checked[a.id]).slice(0, MAX_ADS)
  const perimeter = [...picks, ...Array(Math.max(0, MAX_ADS - picks.length)).fill(null)]
  const slots = {
    top:    perimeter.slice(0, 6),
    right:  perimeter.slice(6, 9),
    bottom: perimeter.slice(9, 15),
    left:   perimeter.slice(15, 18),
  }

  // Named areas (5x6 with center spanning 3x4)
  const gridTemplateAreas = `
    "t1 t2 t3 t4 t5 t6"
    "l1 c  c  c  c  r1"
    "l2 c  c  c  c  r2"
    "l3 c  c  c  c  r3"
    "b1 b2 b3 b4 b5 b6"
  `

  function renderAd(ad, key) {
    return (
      <div
        key={key}
        className="ad-box"
        style={{
          background: '#fff',
          border: '1.5px solid #999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}
      >
        {ad?.image ? (
          <img
            src={ad.image.startsWith('http') ? ad.image : getPublicUrl(ad.image)}
            alt=""
            style={{ maxWidth: '94%', maxHeight: '94%', objectFit: 'contain' }}
          />
        ) : null}
      </div>
    )
  }

  return (
    <Layout>
      {/* PRINT: lock inches to avoid overflow (single page, landscape) */}
      <style jsx global>{`
        @media print {
          @page { size: ${PAPER} landscape; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; height: 100%; }
          -webkit-print-color-adjust: exact; print-color-adjust: exact;

          body * { visibility: hidden !important; }
          .placemat-print-area, .placemat-print-area * { visibility: visible !important; }

          .placemat-print-area {
            position: fixed !important;
            inset: 0 !important;
            background: #fff !important;
            margin: 0 !important; box-shadow: none !important; border: none !important;

            /* page size with a 0.2in safety cushion on each edge */
            width: calc(${PAPER === 'legal' ? '14in' : '11in'} - 0.4in) !important;
            height: calc(8.5in - 0.4in) !important;
            padding: 0.2in !important;
            box-sizing: border-box;

            display: grid !important;
            grid-template-columns: repeat(6, 1.6in) !important;
            grid-template-rows: repeat(5, 1.5in) !important;
            gap: 0.1in !important;
            grid-template-areas:
              "t1 t2 t3 t4 t5 t6"
              "l1 c  c  c  c  r1"
              "l2 c  c  c  c  r2"
              "l3 c  c  c  c  r3"
              "b1 b2 b3 b4 b5 b6";
          }

          .placemat-print-area .ad-box,
          .placemat-print-area .center-print-box {
            page-break-inside: avoid; break-inside: avoid;
          }

          .print\\:hidden { display: none !important; }
          .placemat-print-area button,
          .placemat-print-area input[type="file"] { display: none !important; }
          .placemat-print-area .center-print-box { border: none !important; }
        }
      `}</style>

      {/* Top controls (all together) */}
      <div className="print:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <HomeButton />
        <Button type="outline" onClick={() => router.back()}>⬅️ Back</Button>

        {/* Action buttons moved here */}
        <Button type="primary" onClick={() => window.print()}>Print Placemat</Button>
        <Button
          type="secondary"
          onClick={() => router.push(`/${clubId}/ads-manager/thank-you`)}
        >
          Generate Thank You
        </Button>
      </div>

      <div className="print:hidden" style={{ marginBottom: 16 }}>
        <AdSpace location="ads-manager" clubId={clubId} />
      </div>

      {/* Selection helper */}
      <div className="print:hidden">
        <div className="text-2xl font-semibold mb-2">Generate Your Placemat</div>
        <div className="mb-4 text-gray-600">
          Select up to 18 ads. The center box is your club’s logo or event image (16:9 ratio looks best).
        </div>
        {warn && <div className="text-red-600 font-semibold mb-2">{warn}</div>}

        <div className="mb-6 border rounded p-3 bg-yellow-50 max-w-2xl mx-auto">
          <div className="font-semibold mb-2 text-center">Choose ads to include:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 22, marginBottom: 8 }}>
            {ads.map(ad => (
              <label
                key={ad.id}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  border: '2px solid #5ca8ff22', borderRadius: 12, background: '#fff',
                  padding: 18, minHeight: 200,
                  cursor: checked[ad.id] || numChecked < MAX_ADS ? 'pointer' : 'not-allowed',
                  opacity: checked[ad.id] || numChecked < MAX_ADS ? 1 : 0.6,
                  boxShadow: checked[ad.id] ? '0 0 0 4px #3399ff33' : '0 2px 10px #eee'
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checked[ad.id]}
                  disabled={!checked[ad.id] && numChecked >= MAX_ADS}
                  onChange={() => handleToggle(ad.id)}
                  style={{ marginBottom: 10, width: 22, height: 22 }}
                />
                {ad.image && (
                  <img
                    src={ad.image.startsWith('http') ? ad.image : getPublicUrl(ad.image)}
                    alt={ad.title}
                    style={{
                      width: 110, height: 75, objectFit: 'contain',
                      borderRadius: 7, border: '1.5px solid #aad2f8',
                      marginBottom: 10, background: '#f8fbff'
                    }}
                  />
                )}
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 3, color: '#222' }}>{ad.title}</div>
                <div style={{ fontSize: 15, color: '#3c5370', marginBottom: 2 }}>{ad.text}</div>
                <div style={{ fontSize: 13, color: '#3399ff' }}>
                  Status: {ad.active ? 'Active' : 'Inactive'}
                </div>
              </label>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">{numChecked} of 18 ad boxes selected</div>
        </div>
      </div>

      {/* Screen preview (print uses inch rules above) */}
      <div
        className="placemat-print-area"
        style={{
          width: PAPER === 'legal' ? '1200px' : '1000px',
          height: '650px',
          margin: '30px auto',
          background: '#fff',
          border: 'none',
          boxShadow: 'none',

          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)',
          gridTemplateAreas: gridTemplateAreas,
          gap: '12px'
        }}
      >
        {/* Top row (6) */}
        {slots.top.map((ad, i) => (
          <div key={`t${i}`} style={{ gridArea: `t${i + 1}` }}>
            {renderAd(ad, `t${i + 1}`)}
          </div>
        ))}

        {/* Right column (3) */}
        {slots.right.map((ad, i) => (
          <div key={`r${i}`} style={{ gridArea: `r${i + 1}` }}>
            {renderAd(ad, `r${i + 1}`)}
          </div>
        ))}

        {/* Bottom row (6) */}
        {slots.bottom.map((ad, i) => (
          <div key={`b${i}`} style={{ gridArea: `b${i + 1}` }}>
            {renderAd(ad, `b${i + 1}`)}
          </div>
        ))}

        {/* Left column (3) */}
        {slots.left.map((ad, i) => (
          <div key={`l${i}`} style={{ gridArea: `l${i + 1}` }}>
            {renderAd(ad, `l${i + 1}`)}
          </div>
        ))}

        {/* Center (spans 3x4) */}
        <div style={{ gridArea: 'c' }}>
          <div
            className="center-print-box"
            style={{
              background: '#fff',
              border: '2px dashed #c33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              breakInside: 'avoid',
              pageBreakInside: 'avoid'
            }}
          >
            {centerImage ? (
              <>
                <img
                  src={centerImage}
                  alt="Center"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <Button
                  size="sm" type="outline" className="print:hidden"
                  onClick={() => setCenterImage('')}
                  style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}
                >
                  Remove Image
                </Button>
              </>
            ) : (
              <Button
                size="sm" type="outline" className="print:hidden"
                onClick={() => setShowCenterImageInput(v => !v)}
              >
                📷 Upload Center Image
              </Button>
            )}

            {showCenterImageInput && !centerImage && (
              <input
                type="file" accept="image/*" className="block mx-auto print:hidden"
                style={{ position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, 0)', zIndex: 2 }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return
                  setUploading(true)
                  const filePath = `placemat/${clubId}_${Date.now()}_${file.name}`
                  const { error } = await supabase.storage.from('ads').upload(filePath, file)
                  if (!error) {
                    const { data } = supabase.storage.from('ads').getPublicUrl(filePath)
                    setCenterImage(data?.publicUrl || '')
                    setShowCenterImageInput(false)
                  } else { alert('Image upload failed') }
                  setUploading(false)
                }}
                disabled={uploading}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
