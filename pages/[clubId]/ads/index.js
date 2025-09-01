// pages/[clubId]/ads/index.js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import AdSpace from '@/components/AdSpace'
import { withClubAuth } from '@/utils/withClubAuth'

// IMPORTANT: include 'news' so ads can target the news page banner
const locationOptions = [
  'events','events/edit',
  'members','members/edit',
  'documents','documents/edit',
  'finance','finance/edit',
  'reminders','reminders/edit',
  'rentals','rentals/edit',
  'vendors','vendors/edit',
  'calendar','calendar/edit',
  'news','news/edit',          // ← added
  'ads-manager','home','all'
]

const BANNER_RATIO_W = 3
const BANNER_RATIO_H = 1
const RECOMMENDED_W = 1200
const RECOMMENDED_H = 400

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx)
  if ('redirect' in result) return result
  return { props: result.props }
}

export default function AdsPage({ clubId, clubUser }) {
  const router = useRouter()

  if (clubUser?.role?.toLowerCase() === 'member') {
    return (
      <Layout>
        <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
          <h1 style={{ color: '#d32f2f' }}>🚫 Access Denied</h1>
          <p>You do not have permission to view Ads Manager.</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button type="outline" onClick={() => router.back()}>⬅️ Back</Button>
            <Link href={`/${clubId}`} legacyBehavior>
              <button className="btn-like">🏠 Home</button>
            </Link>
          </div>
        </div>
        <style jsx>{`
          .btn-like { background:#f3f4f6; border:1px solid #ccc; border-radius:8px; padding:8px 14px; cursor:pointer; }
        `}</style>
      </Layout>
    )
  }

  const [ads, setAds] = useState([])
  const [newAd, setNewAd] = useState({ title: '', text: '', location: '', active: true, image: '' })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [adSpaceKey, setAdSpaceKey] = useState(Date.now())
  const [localPreviewUrl, setLocalPreviewUrl] = useState('')

  const getPublicUrl = (path) => {
    if (!path) return ''
    const { data } = supabase.storage.from('ads').getPublicUrl(path)
    return data?.publicUrl || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ads/${path}`
  }

  const fetchAds = async () => {
    if (!clubId) return
    let { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })

    if (error?.message?.toLowerCase().includes('column') && error.message.includes('created_at')) {
      ;({ data, error } = await supabase.from('ads').select('*').eq('club_id', clubId))
    }

    if (error) {
      console.error('Ads fetch error:', error)
      setError(error.message || 'Failed to load ads')
    } else {
      setError(null)
      setAds(data || [])
    }
  }

  useEffect(() => { fetchAds() }, [clubId])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewAd((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setLocalPreviewUrl(URL.createObjectURL(file))
    const filePath = `${Date.now()}_${file.name}`
    const { error: uploadErr } = await supabase.storage.from('ads').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (uploadErr) {
      alert('File upload failed')
      setLocalPreviewUrl('')
    } else {
      setNewAd((prev) => ({ ...prev, image: filePath }))
    }
    setUploading(false)
  }

  const bumpBanner = () => setAdSpaceKey(Date.now())

  const addAd = async () => {
    if (uploading || !clubId) return
    if (!newAd.location) return alert('Please select a Location for the ad.')

    const { error: insertErr } = await supabase.from('ads').insert([{ ...newAd, club_id: clubId }])
    if (insertErr) {
      alert('Failed to add ad: ' + insertErr.message)
      return
    }
    setNewAd({ title: '', text: '', location: '', active: true, image: '' })
    setLocalPreviewUrl('')
    fetchAds()
    bumpBanner()
  }

  const deleteAd = async (id) => {
    if (!id) return alert('No Ad ID provided')
    if (!confirm('Are you sure you want to delete this ad?')) return
    const { error: delErr } = await supabase.from('ads').delete().eq('id', id)
    if (delErr) return alert('Failed to delete ad: ' + delErr.message)
    fetchAds()
    bumpBanner()
  }

  const toggleActive = async (id, current) => {
    if (!id) return
    const { error: updErr } = await supabase.from('ads').update({ active: !current }).eq('id', id)
    if (updErr) return alert('Failed to update ad status: ' + updErr.message)
    fetchAds()
    bumpBanner()
  }

  return (
    <Layout>
      <style jsx global>{`
        .ad-slot { width:100%; aspect-ratio:${BANNER_RATIO_W}/${BANNER_RATIO_H}; background:#f7f7f7; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .ad-slot img { width:100%; height:100%; object-fit:contain; display:block; }
        .ads-table th, .ads-table td { padding:14px 12px !important; vertical-align:middle; }
        .ads-table th { font-size:1.05rem; background:#f3f4f6; }
        .ads-table td { font-size:1rem; border-bottom:1px solid #e5e7eb; }
        .ad-thumb { width:220px; max-width:100%; }
        .ads-table .delete-btn { background:#ef4444; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-size:1rem; font-weight:500; cursor:pointer; transition:background .2s; }
        .ads-table .delete-btn:hover { background:#b91c1c; }
        .ad-form-wrapper { background:#f9fafb; padding:2.2rem 2rem 2rem; border-radius:18px; border:1.5px solid #e5e7eb; max-width:560px; margin:0 auto 2rem; box-shadow:0 2px 12px #f3f4f6; }
        .ad-form-wrapper label { font-size:1.02rem; margin-bottom:0.25rem; font-weight:600; }
        .ad-form-wrapper input[type="text"], .ad-form-wrapper select { font-size:1.05rem; padding:0 16px; height:46px; border:1.5px solid #cbd5e1; border-radius:8px; background:#fff; width:100%; }
        .ad-form-wrapper input[type="file"] { font-size:0.95rem; margin-top:3px; }
        .ad-form-wrapper .form-row { display:flex; flex-direction:column; gap:6px; margin-bottom:1rem; }
        .ad-form-wrapper .form-row.inline { flex-direction:row; align-items:center; gap:18px; margin-bottom:1.25rem; }
        .ad-form-wrapper .add-btn { font-size:1.05rem !important; padding:12px 24px !important; margin-top:0.2rem; }
        .helper { color:#6b7280; font-size:0.92rem; margin-top:2px; }
        .btn-like { background:#f3f4f6; border:1px solid #ccc; border-radius:8px; padding:8px 12px; cursor:pointer; }
      `}</style>

      {/* Header row with Home + Back */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <Link href={`/${clubId}`} legacyBehavior>
          <button className="btn-like">🏠 Home</button>
        </Link>
        <Button type="outline" onClick={() => router.back()}>⬅️ Back</Button>
      </div>

      {/* Live banner preview */}
      <AdSpace key={adSpaceKey} location="ads-manager" clubId={clubId} refreshTrigger={adSpaceKey} />

      <h1 className="text-3xl font-bold mt-4 mb-3">📢 Ads Manager</h1>
      {error && <div className="text-red-600 mb-4">Failed to load ads: {error}</div>}

      {/* Ad Printing */}
      <div className="mt-8 mb-8 p-5 border rounded bg-gray-50 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">🖨️ Ad Printing</h2>
        <div className="flex flex-wrap gap-4">
          <Link href={`/${clubId}/ads-manager/thank-you`} legacyBehavior><button className="btn-like">Generate Thank You</button></Link>
          <Link href={`/${clubId}/ads-manager/placemat`} legacyBehavior><button className="btn-like">Generate Placemat</button></Link>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Add New Ad</h2>
      <div className="ad-form-wrapper">
        <div className="form-row">
          <label htmlFor="ad-title">Title</label>
          <input id="ad-title" type="text" name="title" placeholder="Title" value={newAd.title} onChange={handleInputChange} />
        </div>

        <div className="form-row">
          <label htmlFor="ad-text">Ad Text</label>
          <input id="ad-text" type="text" name="text" placeholder="Ad Text" value={newAd.text} onChange={handleInputChange} />
        </div>

        <div className="form-row">
          <label htmlFor="ad-location">Location</label>
          <select id="ad-location" name="location" value={newAd.location} onChange={handleInputChange} required>
            <option value="">Select Location</option>
            {locationOptions.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <div className="helper">Tip: pick <b>news</b> to show on the News page, or <b>all</b> to show everywhere.</div>
        </div>

        <div className="form-row">
          <label htmlFor="ad-image">Image (optional)</label>
          <input id="ad-image" type="file" onChange={handleFileUpload} disabled={uploading} />
          <div className="helper">Recommended size: <strong>{RECOMMENDED_W}×{RECOMMENDED_H}</strong> (3:1). Images auto-fit.</div>
        </div>

        {(localPreviewUrl || newAd.image) && (
          <div className="form-row">
            <label>Preview</label>
            <div className="ad-slot"><img src={localPreviewUrl || getPublicUrl(newAd.image)} alt="Ad preview" /></div>
            <div className="helper">This is how your ad will appear in banners across the app.</div>
          </div>
        )}

        <div className="form-row inline">
          <label htmlFor="ad-active">Active</label>
          <input id="ad-active" type="checkbox" name="active" checked={newAd.active} onChange={handleInputChange} className="h-5 w-5" />
          <Button type="primary" onClick={addAd} disabled={uploading} className="add-btn">Add Ad</Button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-12 mb-3">Existing Ads</h2>
      <div className="overflow-x-auto w-full">
        <table className="ads-table w-full border rounded mt-4 max-w-5xl">
          <thead>
            <tr>
              <th>Title</th><th>Ad Text</th><th>Location</th><th>Active</th><th>Image</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className="text-center">
                <td>{ad.title}</td>
                <td>{ad.text || <span className="text-gray-400">No Text</span>}</td>
                <td>{ad.location}</td>
                <td>
                  <Button type={ad.active ? 'success' : 'outline'} onClick={() => toggleActive(ad.id, ad.active)} className="px-3 py-1 rounded">
                    {ad.active ? 'Active' : 'Inactive'}
                  </Button>
                </td>
                <td>
                  {ad.image ? (
                    <div className="ad-thumb"><div className="ad-slot"><img src={getPublicUrl(ad.image)} alt={ad.title} loading="lazy" /></div></div>
                  ) : <span className="text-gray-400">No Image</span>}
                </td>
                <td><button onClick={() => deleteAd(ad.id)} className="delete-btn">Delete</button></td>
              </tr>
            ))}
            {ads.length === 0 && (
              <tr><td colSpan={6} className="text-gray-500 py-6">No ads yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
