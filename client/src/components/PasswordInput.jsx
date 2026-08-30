import { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder, required }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{ paddingRight: '2.5rem' }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        style={{
          position: 'absolute',
          right: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          fontSize: '1rem',
        }}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? '🙈' : '👁️'}
      </button>
    </div>
  );
}