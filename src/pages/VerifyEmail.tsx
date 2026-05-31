import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import './Register.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/login/verify-email?token=${token}`);
        if (res.ok) {
          setStatus('success');
        } else {
          const data = await res.json();
          setStatus('error');
          setErrorMessage(data.error || 'Verification failed');
        }
      } catch {
        setStatus('error');
        setErrorMessage('Network error');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="register-page">
      <div className="register-card">
        {status === 'verifying' && (
          <>
            <h1>Verifying Email</h1>
            <p style={{ textAlign: 'center', color: '#90a4ae' }}>Please wait...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1>Email Verified</h1>
            <p style={{ textAlign: 'center', color: '#90a4ae', lineHeight: 1.6 }}>
              Your email has been verified successfully. You can now sign in.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '1rem',
                padding: '0.7rem',
                background: '#4fc3f7',
                color: '#0f0f23',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Sign In
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Verification Failed</h1>
            <p style={{ textAlign: 'center', color: '#ef5350' }}>{errorMessage}</p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '1rem',
                padding: '0.7rem',
                background: '#4fc3f7',
                color: '#0f0f23',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
