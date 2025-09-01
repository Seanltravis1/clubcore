import { useState } from 'react';
import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';
import Button from '@/components/Button';
import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabaseServer';
import { withClubAuth } from '@/utils/withClubAuth';
import hasAccess from '@/utils/hasAccess';
import { supabase } from '@/lib/supabase';

export const getServerSideProps = async (ctx) => {
  const result = await withClubAuth(ctx);
  if ('redirect' in result) return result;
  const { clubId, clubUser, permissions } = result.props;
  const supabaseServer = getServerSupabase(ctx);

  const { data: categories, error: catErr } = await supabaseServer
    .from('maintenance_categories')
    .select('*, items:maintenance_items(*)')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true });

  return {
    props: {
      clubId,
      clubUser,
      permissions,
      categories: categories || [],
      error: catErr?.message || null,
    },
  };
};

export default function MaintenancePage({ clubId, clubUser, permissions, categories: initialCategories, error }) {
  // Block members from this page
  if (clubUser?.role?.toLowerCase() === "member") {
    return (
      <Layout>
        <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
          <h1 style={{ color: "#d32f2f" }}>🚫 Access Denied</h1>
          <p>You do not have permission to view Maintenance.</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href={`/${clubId}`}>
              <Button type="outline">🏠 Home</Button>
            </Link>
            <Button type="outline" onClick={() => window.history.back()}>
              ⬅️ Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const [categories, setCategories] = useState(initialCategories);
  const [deleting, setDeleting] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  // Item fields
  const [selectedCatId, setSelectedCatId] = useState('');
  const [desc, setDesc] = useState('');
  const [notes, setNotes] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [itemFile, setItemFile] = useState(null);

  async function refetchCategories() {
    const { data } = await supabase
      .from('maintenance_categories')
      .select('*, items:maintenance_items(*)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: true });
    setCategories(data || []);
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newLocation || !newItem) return alert('Please enter both a Location and an Item.');
    setLoading(true);
    const { data, error } = await supabase
      .from('maintenance_categories')
      .insert([{ club_id: clubId, type: newLocation, name: newItem }])
      .select('*, items:maintenance_items(*)');
    setLoading(false);
    if (error) return alert('Error adding category: ' + error.message);
    setCategories([...categories, ...(data || [])]);
    setNewLocation('');
    setNewItem('');
  }

  async function handleAddItem(e) {
    e.preventDefault();
    if (!desc || !selectedCatId || !maintenanceDate) return alert('Description, Category, and Date required');
    setLoading(true);

    let fileUrl = null;
    if (itemFile) {
      const filePath = `${clubId}/${Date.now()}_${itemFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('maintenance-files')
        .upload(filePath, itemFile);

      if (uploadError) {
        setLoading(false);
        return alert('File upload failed: ' + uploadError.message);
      }
      fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maintenance-files/${filePath}`;
    }

    const { data, error } = await supabase
      .from('maintenance_items')
      .insert([{
        category_id: selectedCatId,
        description: desc,
        notes,
        company,
        phone,
        file_url: fileUrl,
        maintenance_date: maintenanceDate,
      }])
      .select();

    setLoading(false);
    if (error) return alert('Error: ' + error.message);

    await refetchCategories();
    setDesc(''); setNotes(''); setCompany(''); setPhone(''); setItemFile(null); setMaintenanceDate('');
  }

  async function handleDeleteCategory(catId) {
    if (!window.confirm('Delete this maintenance category and all its items?')) return;
    setDeleting(catId);
    const { error } = await supabase.from('maintenance_categories').delete().eq('id', catId);
    setDeleting(null);
    if (error) return alert('Delete failed: ' + error.message);
    await refetchCategories();
  }

  async function handleDeleteItem(itemId, catId) {
    if (!window.confirm('Delete this item?')) return;
    setDeleting(itemId);
    const { error } = await supabase.from('maintenance_items').delete().eq('id', itemId);
    setDeleting(null);
    if (error) return alert('Delete failed: ' + error.message);
    await refetchCategories();
  }

  if (!hasAccess(clubUser, permissions, 'maintenance', 'view')) {
    return (
      <Layout>
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to view Maintenance.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Link href={`/${clubId}`}>
            <Button type="outline">🏠 Home</Button>
          </Link>
          <Button type="outline" onClick={() => window.history.back()}>
            ⬅️ Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* NAV BUTTONS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: 12 }}>
        <Link href={`/${clubId}`}>
          <Button type="outline">🏠 Home</Button>
        </Link>
        <Button type="outline" onClick={() => window.history.back()}>
          ⬅️ Back
        </Button>
      </div>

      <AdSpace location="maintenance" clubId={clubId} />
      <h1 style={{ fontSize: 32, marginTop: 6, marginBottom: 16 }}>
        🛠️ Maintenance Records
      </h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

      {/* Add Category */}
      {hasAccess(clubUser, permissions, 'maintenance', 'add') && (
        <form style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }} onSubmit={handleAddCategory}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 170 }}>
            <span style={{ fontWeight: 500, marginBottom: 2 }}>Location</span>
            <input
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              placeholder="ie. Rooftop Unit"
              style={{ fontSize: 18, padding: 8 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 170 }}>
            <span style={{ fontWeight: 500, marginBottom: 2 }}>Item</span>
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder="ie. Furnace"
              style={{ fontSize: 18, padding: 8 }}
            />
          </div>
          <Button type="success" disabled={loading}>Add Category</Button>
        </form>
      )}

      {/* Add maintenance item */}
      {hasAccess(clubUser, permissions, 'maintenance', 'add') && (
        <form style={{
          marginBottom: 32, display: 'flex', gap: 10, alignItems: 'flex-end',
          flexWrap: 'wrap'
        }} onSubmit={handleAddItem}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
            <span style={{ fontWeight: 500, marginBottom: 2 }}>Category</span>
            <select
              value={selectedCatId}
              onChange={e => setSelectedCatId(e.target.value)}
              style={{ fontSize: 18, padding: 8, minWidth: 180 }}>
              <option value="">select one</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 130 }}>
            <span style={{ fontWeight: 500, marginBottom: 2 }}>Description</span>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Description"
              style={{ fontSize: 18, padding: 8, minWidth: 120 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 130 }}>
            <span style={{ fontWeight: 500, marginBottom: 2 }}>Notes</span>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes"
              style={{ fontSize: 18, padding: 8, minWidth: 120 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 130 }}>
            <span style={{ fontWeight: 500, marginBottom: 2 }}>Company</span>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Company"
              style={{ fontSize: 18, padding: 8, minWidth: 120 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 130 }}>
            <span style={{ fontWeight: 500, marginBottom: 2 }}>Phone Number</span>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Phone"
              style={{ fontSize: 18, padding: 8, minWidth: 120 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 130 }}>
            <span style={{ fontWeight: 500, marginBottom: 2 }}>Date</span>
            <input
              type="date"
              value={maintenanceDate}
              onChange={e => setMaintenanceDate(e.target.value)}
              required
              style={{ fontSize: 18, padding: 8, minWidth: 120 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
            <span style={{ fontWeight: 500, marginBottom: 2 }}>File</span>
            <input
              type="file"
              accept="*"
              style={{ fontSize: 16 }}
              onChange={e => setItemFile(e.target.files[0])}
            />
          </div>
          <Button type="primary" disabled={loading} style={{ minWidth: 120, marginBottom: 0, height: 48 }}>
            Add Item
          </Button>
        </form>
      )}

      {/* Display Categories and Items */}
      <div style={{ marginTop: 20 }}>
        {categories.length === 0 ? (
          <div style={{ color: '#666', padding: 28 }}>No maintenance categories found.</div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} style={{
              border: '1px solid #ccc', borderRadius: 10, marginBottom: 32,
              background: '#fafcff', boxShadow: '0 2px 8px #0001', padding: 18
            }}>
              {/* Category Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 20 }}>{cat.name}</span>
                  <span style={{ color: '#888', marginLeft: 12 }}>({cat.type})</span>
                </div>
                {hasAccess(clubUser, permissions, 'maintenance', 'delete') && (
                  <Button
                    type="danger"
                    size="sm"
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={deleting === cat.id}
                  >
                    {deleting === cat.id ? 'Deleting...' : 'Delete Category'}
                  </Button>
                )}
              </div>
              {/* Table headers - Only show on desktop */}
              {(cat.items || []).length > 0 && (
                <div className="desktop-only" style={{
                  display: 'flex',
                  fontWeight: 600,
                  color: '#444',
                  background: '#f1f1f4',
                  borderRadius: 8,
                  padding: '8px 0 8px 10px',
                  marginBottom: 8,
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>Description</div>
                  <div style={{ flex: 1 }}>Notes</div>
                  <div style={{ flex: 1 }}>Company</div>
                  <div style={{ flex: 1 }}>Phone Number</div>
                  <div style={{ flex: 1 }}>Date</div>
                  <div style={{ flex: 1 }}>File</div>
                  <div style={{ width: 110 }}></div>
                </div>
              )}
              {/* Items */}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {(cat.items || []).length === 0 ? (
                  <li style={{ color: '#777', padding: 12 }}>No items yet.</li>
                ) : cat.items.map(item => (
                  <li
                    key={item.id}
                    className="maint-list-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 4,
                      padding: '6px 0',
                      borderRadius: 6,
                      background: '#fff',
                      flexWrap: 'wrap',
                      flexDirection: 'row',
                    }}
                  >
                    <div className="maint-field" style={{ flex: 1, minWidth: 120 }}>
                      <b className="maint-label">Description:</b> {item.description || '-'}
                    </div>
                    <div className="maint-field" style={{ flex: 1, minWidth: 120 }}>
                      <b className="maint-label">Notes:</b> {item.notes || '-'}
                    </div>
                    <div className="maint-field" style={{ flex: 1, minWidth: 120 }}>
                      <b className="maint-label">Company:</b> {item.company || '-'}
                    </div>
                    <div className="maint-field" style={{ flex: 1, minWidth: 120 }}>
                      <b className="maint-label">Phone:</b> {item.phone || '-'}
                    </div>
                    <div className="maint-field" style={{ flex: 1, minWidth: 120 }}>
                      <b className="maint-label">Date:</b> {item.maintenance_date || '-'}
                    </div>
                    <div className="maint-field" style={{ flex: 1, minWidth: 120 }}>
                      <b className="maint-label">File:</b>{' '}
                      {item.file_url && item.file_url.startsWith('http') ? (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                          <Button type="primary" size="sm">View File</Button>
                        </a>
                      ) : (
                        <span style={{ color: '#bbb' }}>No File</span>
                      )}
                    </div>
                    {hasAccess(clubUser, permissions, 'maintenance', 'delete') && (
                      <div style={{ minWidth: 110, marginLeft: "auto", textAlign: "right" }}>
                        <Button
                          type="danger"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id, cat.id)}
                          disabled={deleting === item.id}
                        >
                          {deleting === item.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    )}
                    <style jsx>{`
                      @media (max-width: 700px) {
                        .maint-list-item {
                          flex-direction: column !important;
                          align-items: flex-start !important;
                          padding: 14px 8px !important;
                          margin-bottom: 16px !important;
                          border: 1px solid #e5e7eb;
                        }
                        .maint-field {
                          width: 100% !important;
                          min-width: unset !important;
                          margin-bottom: 3px;
                          font-size: 1.06em;
                        }
                        .maint-label {
                          display: inline-block;
                          min-width: 90px;
                          font-weight: 600;
                          color: #333;
                          font-size: 0.98em;
                          margin-right: 6px;
                        }
                        .desktop-only {
                          display: none !important;
                        }
                      }
                    `}</style>
                  </li>
                ))}
                             </ul>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
  

