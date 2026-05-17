import { useEffect, useState, useRef, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import { renderTemplate, customerToVars, availableVars, sampleCustomer, type EmailTemplate } from '../templateUtils';
import './TemplateEditor.css';

const sampleVars = customerToVars(sampleCustomer);

function PreviewIframe({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className="te-preview-iframe"
      title="Email preview"
      sandbox="allow-same-origin"
    />
  );
}

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === 'new';

  const [templateName, setTemplateName] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(420);

  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const previewHtml = renderTemplate(bodyHtml, sampleVars);

  const htmlExtensions = [html(), EditorView.lineWrapping];

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (isNew || !user) return;
    (async () => {
      const res = await fetch(`${API_URL}/api/emailtemplates/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const t: EmailTemplate = await res.json();
        setTemplateName(t.templateName);
        setBodyText(t.bodyText || '');
        setBodyHtml(t.bodyHtml || '');
      } else {
        showToast('Failed to load template', 'error');
      }
      setLoading(false);
    })();
  }, [id, isNew, user]);

  const insertVariable = (v: string) => {
    const tag = `{{${v}}}`;
    const view = cmRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: tag },
      selection: { anchor: from + tag.length },
    });
    view.focus();
  };

  const onHtmlChange = useCallback((value: string) => {
    setBodyHtml(value);
  }, []);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = previewWidth;

    // Create a full-screen overlay to capture mouse events over iframes
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:col-resize;';
    document.body.appendChild(overlay);

    const onMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX;
      const newWidth = Math.max(200, Math.min(startWidth + delta, window.innerWidth - 300));
      setPreviewWidth(newWidth);
    };

    const onMouseUp = () => {
      overlay.remove();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [previewWidth]);

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!user) return;

    setSaving(true);
    const payload = {
      templateName,
      bodyText: bodyText || '',
      bodyHtml: bodyHtml || '',
    };

    const url = isNew
      ? `${API_URL}/api/emailtemplates`
      : `${API_URL}/api/emailtemplates/${id}`;

    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      showToast('Template saved', 'success');
      if (isNew) {
        const created = await res.json();
        navigate(`/templates/${created.emailTemplateGuid}`, { replace: true });
      }
    } else {
      const errorText = await res.text();
      console.error('Save failed:', res.status, errorText);
      showToast(`Failed to save template: ${res.status}`, 'error');
    }
  };

  if (!user || user.role !== 'Admin') {
    return <div className="template-editor"><h1>Access Denied</h1></div>;
  }

  if (loading) return <div className="template-editor"><p>Loading...</p></div>;

  return (
    <div className="template-editor">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="te-topbar">
        <button className="btn-back" onClick={() => navigate('/templates')}>&larr; Templates</button>
        <input
          className="te-name-input"
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          placeholder="Template name..."
          required
        />
        <button
          className={`btn-preview-toggle ${showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview(p => !p)}
        >
          Preview
        </button>
        <button className="btn-save" onClick={handleSave} disabled={saving || !templateName}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="te-variable-bar">
        <span className="hint-label">Insert variables:</span>
        {availableVars.map(v => (
          <code
            key={v}
            className="var-chip"
            onClick={() => insertVariable(v)}
          >
            {`{{${v}}}`}
          </code>
        ))}
      </div>

      <div className="te-main">
        <div className="te-editor-pane">
          <div className="te-code-body">
            <div className="te-code-field te-code-html">
              <CodeMirror
                ref={cmRef}
                value={bodyHtml}
                onChange={onHtmlChange}
                theme={oneDark}
                extensions={htmlExtensions}
                placeholder="HTML content..."
                height="100%"
                className="te-codemirror"
              />
            </div>
            <div className="te-code-field te-code-text">
              <label>Plain Text Fallback</label>
              <textarea
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                placeholder="Plain text fallback (used by email clients that don't support HTML)..."
              />
            </div>
          </div>
        </div>

        {showPreview && (
          <>
          <div className="te-divider" onMouseDown={onDividerMouseDown} />
          <div className="te-preview-pane" style={{ width: previewWidth }}>
            <div className="te-pane-header">
              <span>Preview</span>
              <span className="te-preview-badge">{sampleCustomer.firstName} {sampleCustomer.lastName}</span>
            </div>
            <div className="te-preview-body">
              {previewHtml ? (
                <PreviewIframe html={previewHtml} />
              ) : (
                <p className="te-preview-empty">No content to preview yet.</p>
              )}
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
