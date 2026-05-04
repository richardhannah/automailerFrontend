import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import SignInModal from './SignInModal';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo"><img src="/tellyboxLogo.png" alt="TellyBox" className="logo-img" /></Link>
        <nav>
          {user ? (
            <>
              {user.role === 'Admin' && (
                <>
                  <Link to="/admin">Users</Link>
                  <Link to="/customers">Customers</Link>
                  <Link to="/templates">Templates</Link>
                  <Link to="/reporting">Reporting</Link>
                </>
              )}
              <span className="user-info">{user.username} ({user.role})</span>
              <button onClick={logout} className="btn-logout">Logout</button>
            </>
          ) : (
            <button onClick={() => setShowSignIn(true)} className="btn-signin">Sign In</button>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
