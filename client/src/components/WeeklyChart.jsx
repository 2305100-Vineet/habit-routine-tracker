import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axiosClient from '../api/axiosClient';

export default function WeeklyChart({ refreshTrigger }) {
  const [range, setRange] = useState('weekly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/logs/summary/${range}`);
        const formatted = res.data.map((row) => ({
          date: formatDateLabel(row.completion_date),
          completed: Number(row.completed_count),
          total: row.total_logged,
        }));
        setData(formatted);
      } catch (err) {
        console.error('Failed to load summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [range, refreshTrigger]); // re-fetch when the range changes OR when a habit is toggled elsewhere

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{range === 'weekly' ? 'This Week' : 'This Month'}</h3>
        <div>
          <button
            onClick={() => setRange('weekly')}
            style={{
              background: range === 'weekly' ? '#4caf50' : '#eee',
              color: range === 'weekly' ? 'white' : 'black',
              fontWeight: range === 'weekly' ? 'bold' : 'normal',
            }}
          >
            Weekly
          </button>
          <button
            onClick={() => setRange('monthly')}
            style={{
              marginLeft: '0.5rem',
              background: range === 'monthly' ? '#4caf50' : '#eee',
              color: range === 'monthly' ? 'white' : 'black',
              fontWeight: range === 'monthly' ? 'bold' : 'normal',
            }}
          >
            Monthly
          </button>
        </div>
      </div>

      {loading && <p>Loading chart...</p>}
      {!loading && data.length === 0 && (
        <p>No completion data yet for this {range === 'weekly' ? 'week' : 'month'} — mark a habit complete to see your trend here.</p>
      )}
      {!loading && data.length > 0 && (
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#bbb" name="Total Logged" />
              <Bar dataKey="completed" fill="#4caf50" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function formatDateLabel(dateStr) {
  const [, month, day] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[Number(month) - 1]} ${Number(day)}`;
}