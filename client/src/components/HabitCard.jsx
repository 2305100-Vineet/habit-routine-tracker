import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

function todayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function HabitCard({ habit, onEdit, onDelete, onLogToggled }) {
  const [stats, setStats] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        axiosClient.get(`/logs/${habit.id}/stats`),
        axiosClient.get(`/logs/${habit.id}`),
      ]);
      setStats(statsRes.data);

      const today = todayDateString();
      const todayLog = logsRes.data.find((log) => log.completion_date === today);
      setTodayStatus(todayLog ? todayLog.status : null);
    } catch (err) {
      console.error('Failed to load habit stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit.id]);

  const toggleToday = async () => {
    const newStatus = todayStatus === 'complete' ? 'incomplete' : 'complete';
    try {
      await axiosClient.post(`/logs/${habit.id}`, { date: todayDateString(), status: newStatus });
      fetchStats();
      if (onLogToggled) onLogToggled(); // tell Dashboard to refresh the weekly/monthly chart too
    } catch (err) {
      console.error('Failed to update log', err);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0 }}>{habit.name}</h3>
          {habit.description && <p style={{ margin: '0.25rem 0', color: '#666' }}>{habit.description}</p>}
          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#888', textTransform: 'capitalize' }}>{habit.frequency}</p>
        </div>
        <div>
          <button className="btn-secondary" onClick={onEdit}>Edit</button>
          <button className="btn-danger" onClick={onDelete} style={{ marginLeft: '0.5rem' }}>Delete</button>
        </div>
      </div>

      {!loadingStats && stats && (
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
          <span>🔥 Current: {stats.currentStreak}</span>
          <span>🏆 Longest: {stats.longestStreak}</span>
          <span>✅ {stats.completionPercentage}%</span>
        </div>
      )}

      <button
        className={todayStatus === 'complete' ? 'btn-success' : 'btn-secondary'}
        onClick={toggleToday}
        style={{ marginTop: '0.75rem' }}
      >
        {todayStatus === 'complete' ? '✓ Done Today' : 'Mark Complete Today'}
      </button>
    </div>
  );
}