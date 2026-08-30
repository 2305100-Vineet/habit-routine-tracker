import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.post('/auth/register', { name, email, password });
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '400px' }}>
      <div className="card">
        <h2 style={{ marginTop: 0, color: '#1e3a5f' }}>Register</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Password</label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Confirm Password</label>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: '#d9534f' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Sending code...' : 'Register'}
          </button>
        </form>
        <p style={{ marginBottom: 0 }}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}