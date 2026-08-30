import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (verifying) return;
    setError('');
    setMessage('');
    setVerifying(true);

    try {
      await axiosClient.post('/auth/verify-otp', { email, otp });
      setMessage('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setError('');
    setMessage('');
    setResending(true);
    try {
      await axiosClient.post('/auth/resend-otp', { email });
      setMessage('A new code has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '400px' }}>
      <div className="card">
        <h2 style={{ marginTop: 0, color: '#1e3a5f' }}>Verify Your Email</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          We sent a 6-digit code to your email. Enter it below to finish creating your account.
        </p>
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Verification Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              placeholder="6-digit code"
              required
            />
          </div>
          {error && <p style={{ color: '#d9534f' }}>{error}</p>}
          {message && <p style={{ color: '#2e7d32' }}>{message}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={verifying}>
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        <p>
          Didn't get a code?{' '}
          <button type="button" className="btn-secondary" onClick={handleResend} disabled={resending} style={{ padding: '0.25rem 0.6rem' }}>
            {resending ? 'Sending...' : 'Resend'}
          </button>
        </p>
        <p style={{ marginBottom: 0 }}><Link to="/login">Back to Login</Link></p>
      </div>
    </div>
  );
}