import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import './IptvPackages.css';

interface IptvPackage {
  iptvPackageId: number;
  iptvPackageGuid: string;
  packageName: string;
  price: number;
  billingPeriod: number;
}

interface PackageForm {
  packageName: string;
  price: string;
  billingPeriod: number;
}

const emptyForm: PackageForm = {
  packageName: '',
  price: '',
  billingPeriod: 0,
};

const billingPeriodOptions = [
  { label: 'Monthly', value: 0 },
  { label: 'Annual', value: 1 },
];

export default function IptvPackages() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<IptvPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [editingGuid, setEditingGuid] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isAdmin = user?.role === 'Admin';

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user!.token}`,
  };

  const fetchPackages = async () => {
    const res = await fetch(`${API_URL}/api/iptvpackages`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) setPackages(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      packageName: form.packageName,
      price: parseFloat(form.price),
      billingPeriod: Number(form.billingPeriod),
    };

    if (editingGuid) {
      await fetch(`${API_URL}/api/iptvpackages/${editingGuid}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`${API_URL}/api/iptvpackages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }

    setForm(emptyForm);
    setEditingGuid(null);
    setShowForm(false);
    fetchPackages();
  };

  const startEdit = (p: IptvPackage) => {
    setForm({
      packageName: p.packageName,
      price: p.price.toString(),
      billingPeriod: p.billingPeriod,
    });
    setEditingGuid(p.iptvPackageGuid);
    setShowForm(true);
  };

  const deletePackage = async (guid: string) => {
    if (!confirm('Delete this package?')) return;
    await fetch(`${API_URL}/api/iptvpackages/${guid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    fetchPackages();
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingGuid(null);
    setShowForm(false);
  };

  if (!user) {
    return <div className="iptv-packages"><h1>Access Denied</h1><p>Please sign in.</p></div>;
  }

  if (loading) return <div className="iptv-packages"><p>Loading...</p></div>;

  return (
    <div className="iptv-packages">
      <div className="packages-header">
        <h1>IPTV Packages</h1>
        {isAdmin && !showForm && (
          <button className="btn-add" onClick={() => setShowForm(true)}>
            + Add Package
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form className="package-form" onSubmit={handleSubmit}>
          <h2>{editingGuid ? 'Edit Package' : 'New Package'}</h2>
          <div className="form-grid">
            <div className="field">
              <label>Package Name</label>
              <input
                value={form.packageName}
                onChange={e => setForm({ ...form, packageName: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Billing Period</label>
              <select
                value={form.billingPeriod}
                onChange={e => setForm({ ...form, billingPeriod: Number(e.target.value) })}
              >
                {billingPeriodOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">{editingGuid ? 'Update' : 'Create'}</button>
            <button type="button" className="btn-cancel" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Package Name</th>
            <th>Price</th>
            <th>Billing Period</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {packages.map(p => (
            <tr key={p.iptvPackageGuid}>
              <td>{p.packageName}</td>
              <td>${p.price.toFixed(2)}</td>
              <td>{billingPeriodOptions.find(o => o.value === p.billingPeriod)?.label ?? p.billingPeriod}</td>
              {isAdmin && (
                <td className="actions">
                  <button className="btn-edit" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn-delete" onClick={() => deletePackage(p.iptvPackageGuid)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
          {packages.length === 0 && (
            <tr><td colSpan={isAdmin ? 4 : 3} className="empty">No packages yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
