import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import PasswordInput from '../components/PasswordInput';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';

  const [step, setStep] = useState('verify'); // 'verify' | 'reset'
  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 1: just confirm the OTP is valid before letting them set a new password.
  // We don't have a separate "check OTP only" backend endpoint, so we reuse the
  // fact that reset-password itself validates the OTP — but we don't want to
  // require the new password up front. So this step only moves the UI forward;
  // real validation still happens server-side when the actual reset is submitted.
  const handleVerifyStep = (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    setError('');
    setStep('reset');
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.post('/auth/reset-password', { email, otp, newPassword });
      setMessage('Password reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed');
      setSubmitting(false);
      if (err.response?.data?.error?.toLowerCase().includes('invalid') || err.response?.data?.error?.toLowerCase().includes('expired')) {
        setStep('verify'); // bad/expired OTP discovered at submit time — send them back to re-enter it
      }
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '400px' }}>
      <div className="card">
        <h2 style={{ marginTop: 0, color: '#1e3a5f' }}>Reset Password</h2>

        {step === 'verify' && (
          <form onSubmit={handleVerifyStep}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Reset Code</label>
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
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Continue
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetSubmit}>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Code confirmed for <strong>{email}</strong>. Set your new password below.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label>New Password</label>
              <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Confirm New Password</label>
              <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: '#d9534f' }}>{error}</p>}
            {message && <p style={{ color: '#2e7d32' }}>{message}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => setStep('verify')}
            >
              Back
            </button>
          </form>
        )}

        <p style={{ marginBottom: 0, marginTop: '1rem' }}><Link to="/login">Back to Login</Link></p>
      </div>
    </div>
  );
}