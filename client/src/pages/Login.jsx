import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        navigate('/verify-otp', { state: { email: data.email } });
        return;
      }
      setError(data?.error || 'Login failed');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '400px' }}>
      <div className="card">
        <h2 style={{ marginTop: 0, color: '#1e3a5f' }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Password</label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <p style={{ margin: '0 0 1rem', textAlign: 'right' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem' }}>Forgot password?</Link>
          </p>
          {error && <p style={{ color: '#d9534f' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
        </form>
        <p style={{ marginBottom: 0 }}>No account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}