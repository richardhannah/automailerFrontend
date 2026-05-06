import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import './Enquiries.css';

interface Enquiry {
  enquiryId: number;
  email: string;
  phoneNumber: string | null;
  message: string;
  dateReceived: string;
}

export default function Enquiries() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const headers = { Authorization: `Bearer ${user!.token}` };

  const fetchEnquiries = async () => {
    const res = await fetch(`${API_URL}/api/Enquiries`, { headers });
    if (res.ok) setEnquiries(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const deleteEnquiry = async (id: number) => {
    if (!confirm('Delete this enquiry?')) return;
    await fetch(`${API_URL}/api/Enquiries/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (selected?.enquiryId === id) setSelected(null);
    fetchEnquiries();
  };

  if (!user || user.role !== 'Admin') {
    return <div className="enquiries"><h1>Access Denied</h1><p>Admin role required.</p></div>;
  }

  if (loading) return <div className="enquiries"><p>Loading...</p></div>;

  return (
    <div className="enquiries">
      <div className="enquiries-header">
        <h1>Enquiries</h1>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Message</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {enquiries.map(e => (
            <tr
              key={e.enquiryId}
              onClick={() => setSelected(e)}
            >
              <td>{new Date(e.dateReceived).toLocaleDateString()}</td>
              <td>{e.email}</td>
              <td>{e.phoneNumber || '—'}</td>
              <td className="message-preview">{e.message}</td>
              <td className="actions">
                <button className="btn-delete" onClick={ev => { ev.stopPropagation(); deleteEnquiry(e.enquiryId); }}>Delete</button>
              </td>
            </tr>
          ))}
          {enquiries.length === 0 && (
            <tr><td colSpan={5} className="empty">No enquiries yet.</td></tr>
          )}
        </tbody>
      </table>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="enquiry-detail" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enquiry Details</h2>
              <button className="btn-cancel" onClick={() => setSelected(null)}>Close</button>
            </div>
            <div className="enquiry-detail-body">
              <div className="detail-field">
                <span className="detail-label">Date</span>
                <span>{new Date(selected.dateReceived).toLocaleString()}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Email</span>
                <span>{selected.email}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Phone</span>
                <span>{selected.phoneNumber || '—'}</span>
              </div>
              <div className="detail-field">
                <span className="detail-label">Message</span>
                <p className="detail-message">{selected.message}</p>
              </div>
              <button className="btn-delete" onClick={() => deleteEnquiry(selected.enquiryId)}>Delete Enquiry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
