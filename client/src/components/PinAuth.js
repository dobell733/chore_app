import { useState } from 'react';
import './PinAuth.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function PinAuth({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/parent/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError('Incorrect PIN. Please try again.');
          setPin('');
          return;
        }
        throw new Error('Unable to verify PIN');
      }

      const data = await res.json();
      if (data?.ok) {
        setError('');
        onAuthenticated();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="pin-auth-container">
        <div className="pin-auth-card">
        <div className="pin-auth-inner">
            <h2>🔒 Parent Access Required</h2>
            <p>Please enter your PIN to access the Parent Dashboard</p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
            <div className="pin-input-group">
                <input
                type="password"
                className="pin-input"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                maxLength="10"
                />
            </div>
            <button type="submit" className="pin-submit-btn">
                Submit
            </button>
            </form>
        </div>
        </div>
    </div>
  );
}

export default PinAuth;