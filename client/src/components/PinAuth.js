import { useState } from 'react';
import './PinAuth.css';

function PinAuth({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPin = process.env.REACT_APP_PARENT_PIN;
    
    if (pin === correctPin) {
      setError('');
      onAuthenticated();
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
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