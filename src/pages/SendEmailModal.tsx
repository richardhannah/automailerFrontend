import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import { renderTemplate, customerToVars, type EmailTemplate, type Customer } from '../templateUtils';
import './SendEmailModal.css';

interface Props {
  customer: Customer;
  onClose: () => void;
  onSent: () => void;
}

export default function SendEmailModal({ customer, onClose, onSent }: Props) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedGuid, setSelectedGuid] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);

  const vars = customerToVars(customer);
  const selected = templates.find(t => t.emailTemplateGuid === selectedGuid) ?? null;

  useEffect(() => {
    fetch(`${API_URL}/api/emailtemplates`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setTemplates);
  }, []);

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    const body = selected.bodyHtml
      ? renderTemplate(selected.bodyHtml, vars)
      : renderTemplate(selected.bodyText || '', vars);

    const res = await fetch(`${API_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user!.token}`,
      },
      body: JSON.stringify({
        to: customer.email,
        toName: `${customer.firstName} ${customer.lastName}`,
        subject: renderTemplate(subject, vars),
        body,
      }),
    });

    setSending(false);
    if (res.ok) {
      onSent();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Email to {customer.firstName} {customer.lastName}</h2>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>

        <div className="modal-body">
          <div className="modal-form-section">
            <div className="field">
              <label>Template</label>
              <select
                value={selectedGuid || ''}
                onChange={e => setSelectedGuid(e.target.value || null)}
              >
                <option value="">Select a template...</option>
                {templates.map(t => (
                  <option key={t.emailTemplateGuid} value={t.emailTemplateGuid}>
                    {t.templateName}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Hello {{customer.firstName}}!"
              />
            </div>
            <div className="field">
              <label>To</label>
              <input value={customer.email} disabled />
            </div>
            <div className="modal-actions">
              <button
                className="btn-send"
                onClick={handleSend}
                disabled={!selected || !subject || sending}
              >
                {sending ? 'Sending...' : 'Send Email'}
              </button>
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
            </div>
          </div>

          <div className="modal-preview-section">
            <h3>Preview</h3>
            {selected ? (
              selected.bodyHtml ? (
                <div
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: renderTemplate(selected.bodyHtml, vars) }}
                />
              ) : selected.bodyText ? (
                <pre className="preview-text">{renderTemplate(selected.bodyText, vars)}</pre>
              ) : (
                <p className="empty">Template has no content.</p>
              )
            ) : (
              <p className="empty">Select a template to preview.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
