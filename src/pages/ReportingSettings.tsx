import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import { type EmailTemplate } from '../templateUtils';
import './ReportingSettings.css';

interface ReportSetting {
  reportingSettingId: number;
  name: string;
  emailAddress: string;
  emailTemplateId: number | null;
}

interface ReportSettingForm {
  name: string;
  emailAddress: string;
  emailTemplateId: number | null;
}

const emptyForm: ReportSettingForm = {
  name: '',
  emailAddress: '',
  emailTemplateId: null,
};

export default function ReportingSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReportSetting[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ReportSettingForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user!.token}`,
  };

  const fetchSettings = async () => {
    const res = await fetch(`${API_URL}/api/ReportSettings`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) setSettings(await res.json());
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const res = await fetch(`${API_URL}/api/EmailTemplates`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) setTemplates(await res.json());
  };

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      emailAddress: form.emailAddress,
      emailTemplateId: form.emailTemplateId || null,
    };

    let res: Response;
    if (editingId) {
      res = await fetch(`${API_URL}/api/ReportSettings/${editingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`${API_URL}/api/ReportSettings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      showToast(editingId ? 'Recipient updated' : 'Recipient added', 'success');
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchSettings();
    } else {
      showToast('Something went wrong', 'error');
    }
  };

  const startEdit = (s: ReportSetting) => {
    setForm({
      name: s.name,
      emailAddress: s.emailAddress,
      emailTemplateId: s.emailTemplateId,
    });
    setEditingId(s.reportingSettingId);
    setShowForm(true);
  };

  const deleteSetting = async (id: number) => {
    if (!confirm('Delete this recipient?')) return;
    const res = await fetch(`${API_URL}/api/ReportSettings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) {
      showToast('Recipient deleted', 'success');
      fetchSettings();
    } else {
      showToast('Failed to delete', 'error');
    }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  if (!user || user.role !== 'Admin') {
    return <div className="reporting-settings"><h1>Access Denied</h1><p>Admin role required.</p></div>;
  }

  if (loading) return <div className="reporting-settings"><p>Loading...</p></div>;

  return (
    <div className="reporting-settings">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      <div className="reporting-header">
        <h1>Reporting Settings</h1>
        {!showForm && (
          <button className="btn-add" onClick={() => setShowForm(true)}>
            + Add Recipient
          </button>
        )}
      </div>

      {showForm && (
        <form className="reporting-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Recipient' : 'New Recipient'}</h2>
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                value={form.emailAddress}
                onChange={e => setForm({ ...form, emailAddress: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Email Template (optional)</label>
              <select
                value={form.emailTemplateId ?? ''}
                onChange={e => setForm({ ...form, emailTemplateId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">None</option>
                {templates.map(t => (
                  <option key={t.emailTemplateId} value={t.emailTemplateId}>{t.templateName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" className="btn-cancel" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email Address</th>
            <th>Template</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {settings.map(s => (
            <tr key={s.reportingSettingId}>
              <td>{s.name}</td>
              <td>{s.emailAddress}</td>
              <td>{templates.find(t => t.emailTemplateId === s.emailTemplateId)?.templateName || '—'}</td>
              <td className="actions">
                <button className="btn-edit" onClick={() => startEdit(s)}>Edit</button>
                <button className="btn-delete" onClick={() => deleteSetting(s.reportingSettingId)}>Delete</button>
              </td>
            </tr>
          ))}
          {settings.length === 0 && (
            <tr><td colSpan={4} className="empty">No report recipients yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
