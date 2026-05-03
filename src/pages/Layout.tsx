import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo"><img src="/tellyboxLogo.png" alt="TellyBox" className="logo-img" /></Link>
        <nav>
          {user && (
            <>
              {user.role === 'Admin' && (
                <>
                  <Link to="/admin">Users</Link>
                  <Link to="/customers">Customers</Link>
                </>
              )}
              <span className="user-info">{user.username} ({user.role})</span>
              <button onClick={logout} className="btn-logout">Logout</button>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
