import { useEffect, useState } from 'react';
import ChildCard from '../components/ChildCard';
import './ChildPage.css';

function ChildPage({ onChildClick }) {
  const [children, setChildren] = useState([]);
  const [showSpinner, setShowSpinner] = useState(false);

  // Set to true to force spinner for testing
  const [forceSpinner] = useState(false);

  useEffect(() => {
    const apiEndpoint = `${process.env.REACT_APP_API_BASE_URL}/children`;

    // Show spinner after 1 second delay
    const spinnerTimer = setTimeout(() => {
      setShowSpinner(true);
    }, 1000);

    fetch(apiEndpoint)
      .then((response) => response.json())
      .then((data) => {
        clearTimeout(spinnerTimer);
        setChildren(data);
        setShowSpinner(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        clearTimeout(spinnerTimer);
        setShowSpinner(false);
      });
      
  }, []);

  const LoadingSpinner = () => (
    <div className="loading-container">
      <svg 
        className="loading-spinner" 
        width="80" 
        height="80" 
        viewBox="0 0 800 800"
      >
        <circle 
          className="spin-circle"
          cx="400" 
          cy="400" 
          fill="none"
          r="200" 
          strokeWidth="50" 
          stroke="#4ECDC4"
          strokeDasharray="700 1400"
          strokeLinecap="round"
        />
      </svg>
      <p className="loading-message">Waiting for backend to wake up...</p>
    </div>
  );

  return (
    <div className='main_page_container'>
      <section className='main'>
        {showSpinner || forceSpinner ? 
        ( <LoadingSpinner /> ) : (
          <>
            <h2 className='child_title'>Who are you?</h2>
            {children.map((child) => (
              <ChildCard key={child.id} child={child} onClick={() => onChildClick(child)} />
            ))}
          </>
        )}
      </section>
    </div>
  );
}

export default ChildPage;