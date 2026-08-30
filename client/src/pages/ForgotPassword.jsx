import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await axiosClient.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      setSubmitted(true); // stop showing the form, show a "Continue" button instead of auto-redirecting
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '400px' }}>
      <div className="card">
        <h2 style={{ marginTop: 0, color: '#1e3a5f' }}>Forgot Password</h2>

        {!submitted && (
          <>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Enter your email and we'll send you a code to reset your password.
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {error && <p style={{ color: '#d9534f' }}>{error}</p>}
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        {submitted && (
          <>
            <p style={{ color: '#2e7d32' }}>{message}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Check your inbox (and spam folder) for the code, then continue below.
            </p>
            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => navigate('/reset-password', { state: { email } })}
            >
              I have my code — Continue
            </button>
          </>
        )}

        <p style={{ marginBottom: 0, marginTop: '1rem' }}><Link to="/login">Back to Login</Link></p>
      </div>
    </div>
  );
}