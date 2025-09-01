import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import AdSpace from '@/components/AdSpace'
import HomeButton from '@/components/HomeButton'
import Button from '@/components/Button'
import { supabase } from '@/lib/supabase'

export default function ThankYouPage() {
  const router = useRouter()
  const { clubId } = router.query
  const [ads, setAds] = useState([])
  const [checked, setChecked] = useState({})
  const [message, setMessage] = useState('Thank You to Our Advertisers!')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!clubId) return
    const fetchAds = async () => {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('club_id', clubId)
      const safeData = Array.isArray(data) ? data : []
      setAds(safeData)
      let initialChecked = {}
      safeData.forEach(ad => {
        initialChecked[ad.id] = ad.active
      })
      setChecked(initialChecked)
    }
    fetchAds()
  }, [clubId])

  const handleToggle = (id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const displayAds = ads.filter(ad => checked[ad.id])

  return (
    <Layout>
      <style jsx global>{`
        .thankyou-ad-selection {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
          max-width: 1000px;
          margin: 0 auto 2.5rem auto;
        }
        @media (max-width: 900px) {
          .thankyou-ad-selection { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 650px) {
          .thankyou-ad-selection { grid-template-columns: 1fr; }
        }
        .thankyou-ad-box {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #fff;
          padding: 20px 10px 10px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 180px;
          box-shadow: 0 2px 10px #eee;
        }
        .thankyou-ad-img {
          width: 100px;
          height: 66px;
          object-fit: contain;
          margin-bottom: 10px;
          border-radius: 8px;
          background: #f5f5f5;
        }
        /* PRINT-ONLY grid */
        .thankyou-print-area { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          .thankyou-print-area, .thankyou-print-area * { visibility: visible !important; }
          .thankyou-print-area {
            position: absolute !important;
            left: 0; top: 0; width: 100vw; min-height: 100vh;
            margin: 0 !important; background: #fff !important;
            box-shadow: none !important; border: none !important; z-index: 99999;
            display: block !important;
          }
          .thankyou-print-message {
            font-size: 2.6rem !important;
            font-weight: bold;
            margin-bottom: 2rem;
            text-align: center;
          }
          .thankyou-print-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0 !important;
            margin: 0 auto !important;
            width: 90vw !important;
            max-width: 1100px !important;
            justify-items: center !important;
          }
          .thankyou-print-ad {
            display: flex !important; flex-direction: column !important; align-items: center !important;
            background: #fff !important;
            border: none !important;
            box-shadow: none !important;
            min-height: 200px !important;
            justify-content: center;
            padding: 24px 0 !important;
          }
          .thankyou-print-img {
            width: 300px !important;
            height: 180px !important;
            margin-bottom: 10px !important;
            object-fit: contain !important;
            background: #f5f5f5 !important;
            border-radius: 12px !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      {/* --- UI Controls (hidden in print) --- */}
      <div className="print:hidden">
        <HomeButton />
        <Button
          type="outline"
          style={{ marginLeft: 10 }}
          onClick={() => router.back()}
        >⬅️ Back</Button>
        <div className="my-4">
          <AdSpace location="adsmanager" clubId={clubId} />
        </div>
        {/* Editable message section */}
        <div className="text-center mb-6">
          <div className="flex justify-center gap-4 mb-2">
            <Button type="outline" size="sm" onClick={() => setEditing(!editing)}>
              ✏️ Edit Message
            </Button>
            <Button
              type="primary"
              size="sm"
              className="ml-2"
              onClick={() => window.print()}
            >
              🖨️ Print Thank You 
            </Button>
          </div>
          {editing ? (
            <div>
              <textarea
                className="border rounded p-2 text-xl w-full max-w-lg mx-auto"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={2}
                style={{ resize: 'vertical', fontWeight: 'bold', fontSize: '1.2rem' }}
              />
              <div className="mt-2">
                <Button type="success" onClick={() => setEditing(false)}>Save</Button>
              </div>
            </div>
          ) : (
            <h1 className="text-3xl font-bold mb-1">{message}</h1>
          )}
          <div className="text-lg text-gray-600 mt-1">
            <span>We appreciate the support from these businesses:</span>
          </div>
        </div>
        {/* Toggleable ad list */}
        <div className="mb-6 border rounded p-3 bg-yellow-50 max-w-3xl mx-auto">
          <div className="font-semibold mb-2 text-center">Choose which ads appear:</div>
          <div className="thankyou-ad-selection">
            {ads.map(ad => (
              <label key={ad.id} className="thankyou-ad-box" style={{ cursor: 'pointer', minHeight: 140 }}>
                <input
                  type="checkbox"
                  checked={!!checked[ad.id]}
                  onChange={() => handleToggle(ad.id)}
                  style={{ marginBottom: 10, marginTop: -2 }}
                />
                {ad.image && (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ads/${ad.image}`}
                    alt={ad.title}
                    className="thankyou-ad-img"
                  />
                )}
                <div style={{ fontWeight: 600, fontSize: 17 }}>{ad.title}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{ad.text}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>
                  Status: {ad.active ? "Active" : "Inactive"}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* --- PRINT AREA ONLY --- */}
      <div className="thankyou-print-area">
        <div className="thankyou-print-message">
          {message}
        </div>
        <div className="thankyou-print-grid">
          {displayAds.map(ad => (
            <div key={ad.id} className="thankyou-print-ad">
              {ad.image && (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ads/${ad.image}`}
                  alt={ad.title}
                  className="thankyou-print-img"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
