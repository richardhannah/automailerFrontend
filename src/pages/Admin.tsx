import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import './Admin.css';

interface UserRecord {
  userId: string;
  username: string;
  role: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) setUsers(await res.json());
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

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user?')) return;
    await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    fetchUsers();
  };

  if (!user || user.role !== 'Admin') {
    return <div className="admin"><h1>Access Denied</h1><p>Admin role required.</p></div>;
  }

  if (loading) return <div className="admin"><p>Loading...</p></div>;

  return (
    <div className="admin">
      <h1>User Management</h1>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.userId}>
              <td>{u.username}</td>
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
