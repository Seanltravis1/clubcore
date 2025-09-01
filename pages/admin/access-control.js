// pages/admin/access-control.js
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import AdSpace from '@/components/AdSpace';

const sections = ['events', 'rentals', 'vendors', 'finance', 'members', 'documents', 'reminders'];
const actions = ['view', 'edit', 'create'];
const roles = ['admin', 'staff', 'member', 'guest'];

export default function AccessControlPage() {
  const [role, setRole] = useState('member');
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const storedRole = localStorage.getItem('clubcore-role') || 'member';
    const storedPermissions = localStorage.getItem('clubcore-permissions');
    setRole(storedRole);
    setPermissions(storedPermissions ? JSON.parse(storedPermissions) : {});
  }, []);

  const togglePermission = (section, action, role) => {
    setPermissions(prev => {
      const next = { ...prev };
      next[section] = next[section] || {};
      next[section][action] = next[section][action] || [];
      const set = new Set(next[section][action]);
      set.has(role) ? set.delete(role) : set.add(role);
      next[section][action] = Array.from(set);
      return next;
    });
  };

  const saveAll = () => {
    localStorage.setItem('clubcore-role', role);
    localStorage.setItem('clubcore-permissions', JSON.stringify(permissions));
    alert('Permissions and role saved!');
  };

  return (
    <Layout>
      <AdSpace location="admin" />
      <h1 className="text-2xl font-bold mb-4">Access Control Admin</h1>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Current Role:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <table className="border-collapse border border-gray-400">
        <thead>
          <tr>
            <th className="border p-2">Section</th>
            <th className="border p-2">Action</th>
            {roles.map(r => <th key={r} className="border p-2">{r}</th>)}
          </tr>
        </thead>
        <tbody>
          {sections.map(section => (
            actions.map(action => (
              <tr key={`${section}-${action}`}>
                <td className="border p-2">{section}</td>
                <td className="border p-2">{action}</td>
                {roles.map(r => (
                  <td key={r} className="border p-2 text-center">
                    <input
                      type="checkbox"
                      checked={permissions?.[section]?.[action]?.includes(r) || false}
                      onChange={() => togglePermission(section, action, r)}
                    />
                  </td>
                ))}
              </tr>
            ))
          ))}
        </tbody>
      </table>

      <button
        onClick={saveAll}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save Changes
      </button>
    </Layout>
  );
}
