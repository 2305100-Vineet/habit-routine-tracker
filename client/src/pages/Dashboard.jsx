import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import HabitForm from '../components/HabitForm';
import HabitCard from '../components/HabitCard';
import WeeklyChart from '../components/WeeklyChart';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingHabit, setEditingHabit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [chartRefreshKey, setChartRefreshKey] = useState(0);

  const fetchHabits = async () => {
    try {
      const res = await axiosClient.get('/habits');
      setHabits(res.data);
    } catch (err) {
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleHabitSaved = () => {
    setShowForm(false);
    setEditingHabit(null);
    fetchHabits();
  };

  const handleDelete = async (habitId) => {
    if (!window.confirm('Delete this habit? This also deletes all its logs.')) return;
    try {
      await axiosClient.delete(`/habits/${habitId}`);
      fetchHabits();
      setChartRefreshKey((k) => k + 1);
    } catch (err) {
      setError('Failed to delete habit');
    }
  };

  const handleEdit = (habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleLogToggled = () => {
    setChartRefreshKey((k) => k + 1);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account permanently? This will delete all your habits and history. This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await axiosClient.delete('/auth/account');
      logout();
      navigate('/register');
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>;

  return (
    <div>
      <div className="header-bar">
        <h2>Hi, {user?.name}</h2>
        <div>
          <button className="btn-secondary" onClick={logout}>Logout</button>
          <button className="btn-danger" onClick={handleDeleteAccount} style={{ marginLeft: '0.5rem' }}>
            Delete Account
          </button>
        </div>
      </div>

      <div className="page-container">
        {error && <p style={{ color: '#d9534f' }}>{error}</p>}

        <div className="card">
          <WeeklyChart refreshTrigger={chartRefreshKey} />
        </div>

        {!showForm && (
          <button
            className="btn-primary"
            onClick={() => { setEditingHabit(null); setShowForm(true); }}
            style={{ marginBottom: '1.5rem' }}
          >
            + Add Habit
          </button>
        )}

        {showForm && (
          <HabitForm
            existingHabit={editingHabit}
            onSaved={handleHabitSaved}
            onCancel={() => { setShowForm(false); setEditingHabit(null); }}
          />
        )}

        {habits.length === 0 && !showForm && <p>No habits yet — add your first one above.</p>}

        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onEdit={() => handleEdit(habit)}
            onDelete={() => handleDelete(habit.id)}
            onLogToggled={handleLogToggled}
          />
        ))}
      </div>
    </div>
  );
}