import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import { renderTemplate, customerToVars, availableVars, sampleCustomer, type EmailTemplate } from '../templateUtils';
import './EmailTemplates.css';

interface TemplateForm {
  templateName: string;
  bodyText: string;
  bodyHtml: string;
}

const sampleVars = customerToVars(sampleCustomer);

const emptyForm: TemplateForm = {
  templateName: '',
  bodyText: '',
  bodyHtml: '',
};

export default function EmailTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user!.token}`,
  };

  const fetchTemplates = async () => {
    const res = await fetch(`${API_URL}/api/emailtemplates`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      templateName: form.templateName,
      bodyText: form.bodyText || null,
      bodyHtml: form.bodyHtml || null,
    };

    let res: Response;
    if (editingId) {
      res = await fetch(`${API_URL}/api/emailtemplates/${editingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`${API_URL}/api/emailtemplates`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      showToast(editingId ? 'Template updated' : 'Template created', 'success');
    } else {
      showToast('Failed to save template', 'error');
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    fetchTemplates();
  };

  const startEdit = (t: EmailTemplate) => {
    setForm({
      templateName: t.templateName,
      bodyText: t.bodyText || '',
      bodyHtml: t.bodyHtml || '',
    });
    setEditingId(t.emailTemplateGuid);
    setShowForm(true);
  };

  const deleteTemplate = async (guid: string) => {
    if (!confirm('Delete this template?')) return;
    const res = await fetch(`${API_URL}/api/emailtemplates/${guid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) {
      showToast('Template deleted', 'success');
    } else {
      showToast('Failed to delete template', 'error');
    }
    fetchTemplates();
  };

  const togglePreview = (guid: string) => {
    if (preview?.emailTemplateGuid === guid) {
      setPreview(null);
    } else {
      const t = templates.find(t => t.emailTemplateGuid === guid);
      if (t) setPreview(t);
    }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  if (!user || user.role !== 'Admin') {
    return <div className="templates"><h1>Access Denied</h1><p>Admin role required.</p></div>;
  }

  if (loading) return <div className="templates"><p>Loading...</p></div>;

  return (
    <div className="templates">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      <div className="templates-header">
        <h1>Email Templates</h1>
        {!showForm && (
          <button className="btn-add" onClick={() => setShowForm(true)}>
            + Add Template
          </button>
        )}
      </div>

      {showForm && (
        <form className="template-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Template' : 'New Template'}</h2>
          <div className="form-fields">
            <div className="field">
              <label>Template Name</label>
              <input
                value={form.templateName}
                onChange={e => setForm({ ...form, templateName: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Body (Plain Text)</label>
              <textarea
                value={form.bodyText}
                onChange={e => setForm({ ...form, bodyText: e.target.value })}
                rows={6}
                placeholder="Plain text version of the email..."
              />
            </div>
            <div className="field">
              <label>Body (HTML)</label>
              <textarea
                value={form.bodyHtml}
                onChange={e => setForm({ ...form, bodyHtml: e.target.value })}
                rows={8}
                placeholder="HTML version of the email..."
                className="html-editor"
              />
            </div>
          </div>
          <div className="variable-hint">
            <span className="hint-label">Available variables:</span>
            {availableVars.map(v => (
              <code key={v}>{`{{${v}}}`}</code>
            ))}
          </div>
          <div className="form-actions">
            <button type="submit">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" className="btn-cancel" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="templates-body">
        <div className="templates-list">
          <table>
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Has Text</th>
                <th>Has HTML</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.emailTemplateGuid}>
                  <td>{t.templateName}</td>
                  <td>{t.bodyText ? 'Yes' : 'No'}</td>
                  <td>{t.bodyHtml ? 'Yes' : 'No'}</td>
                  <td className="actions">
                    <button className="btn-edit" onClick={() => startEdit(t)}>Edit</button>
                    <button className="btn-preview" onClick={() => togglePreview(t.emailTemplateGuid)}>Preview</button>
                    <button className="btn-delete" onClick={() => deleteTemplate(t.emailTemplateGuid)}>Delete</button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr><td colSpan={4} className="empty">No templates yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {preview && (
        <div className="preview-overlay" onClick={() => setPreview(null)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div className="preview-header">
              <h3>Preview: {preview.templateName}</h3>
              <button className="btn-cancel" onClick={() => setPreview(null)}>Close</button>
            </div>
            <div className="preview-body">
              {preview.bodyHtml ? (
                <div className="preview-content" dangerouslySetInnerHTML={{ __html: renderTemplate(preview.bodyHtml, sampleVars) }} />
              ) : preview.bodyText ? (
                <pre className="preview-text">{renderTemplate(preview.bodyText, sampleVars)}</pre>
              ) : (
                <p className="empty">No content to preview.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
