import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import './Admin.css';

interface UserRecord {
  userId: string;
  username: string;
  role: string;
  email: string;
  customerEmail: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailEdits, setEmailEdits] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) {
      const data: UserRecord[] = await res.json();
      setUsers(data);
      const edits: Record<string, string> = {};
      for (const u of data) {
        edits[u.userId] = u.email || u.customerEmail;
      }
      setEmailEdits(edits);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, role: string) => {
    await fetch(`${API_URL}/api/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user!.token}`,
      },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  };

  const saveEmail = async (userId: string) => {
    const email = emailEdits[userId] ?? '';
    const res = await fetch(`${API_URL}/api/users/${userId}/email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user!.token}`,
      },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      showToast('Email saved', 'success');
      fetchUsers();
    } else {
      showToast('Failed to save email', 'error');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user?')) return;
    await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    fetchUsers();
  };

  const isEmailDirty = (u: UserRecord) => {
    const current = emailEdits[u.userId] ?? '';
    return current !== u.email;
  };

  if (!user || user.role !== 'Admin') {
    return <div className="admin"><h1>Access Denied</h1><p>Admin role required.</p></div>;
  }

  if (loading) return <div className="admin"><p>Loading...</p></div>;

  return (
    <div className="admin">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      <h1>User Management</h1>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.userId}>
              <td>{u.username}</td>
              <td>
                <div className="email-cell">
                  <input
                    type="email"
                    value={emailEdits[u.userId] ?? ''}
                    onChange={e => setEmailEdits({ ...emailEdits, [u.userId]: e.target.value })}
                    placeholder="No email"
                  />
                  <button
                    className={`btn-save-email${isEmailDirty(u) ? ' highlighted' : ''}`}
                    onClick={() => saveEmail(u.userId)}
                    disabled={!isEmailDirty(u)}
                  >
                    Save
                  </button>
                </div>
              </td>
              <td>
                <select
                  value={u.role}
                  onChange={e => updateRole(u.userId, e.target.value)}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </td>
              <td>
                <button
                  className="btn-delete"
                  onClick={() => deleteUser(u.userId)}
                  disabled={u.username === 'admin'}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
