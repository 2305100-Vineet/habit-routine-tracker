import { useState } from 'react';
import axiosClient from '../api/axiosClient';

export default function HabitForm({ existingHabit, onSaved, onCancel }) {
  const isEditing = !!existingHabit;

  const [name, setName] = useState(existingHabit?.name || '');
  const [description, setDescription] = useState(existingHabit?.description || '');
  const [frequency, setFrequency] = useState(existingHabit?.frequency || 'daily');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEditing) {
        await axiosClient.put(`/habits/${existingHabit.id}`, { name, description, frequency });
      } else {
        await axiosClient.post('/habits', { name, description, frequency });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save habit');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 style={{ marginTop: 0 }}>{isEditing ? 'Edit Habit' : 'New Habit'}</h3>
      <div style={{ marginBottom: '0.75rem' }}>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label>Description (optional)</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label>Frequency</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      {error && <p style={{ color: '#d9534f' }}>{error}</p>}
      <button type="submit" className="btn-primary">{isEditing ? 'Save Changes' : 'Create Habit'}</button>
      <button type="button" className="btn-secondary" onClick={onCancel} style={{ marginLeft: '0.5rem' }}>Cancel</button>
    </form>
  );
}