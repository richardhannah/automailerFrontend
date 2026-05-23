import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import SignInModal from './SignInModal';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSignIn, setShowSignIn] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo"><img src="/tellyboxLogo.png" alt="TellyBox" className="logo-img" /></Link>
        <nav>
          {user ? (
            <>
              <Link to="/packages">Packages</Link>
              {user.role === 'Admin' && (
                <>
                  <Link to="/admin">Users</Link>
                  <Link to="/customers">Customers</Link>
                  <Link to="/templates">Templates</Link>
                  <Link to="/enquiries">Enquiries</Link>
                  <Link to="/settings">Settings</Link>
                </>
              )}
              <span className="user-info">{user.username} ({user.role})</span>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
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
