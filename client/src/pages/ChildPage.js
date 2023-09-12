import React, { useEffect, useState } from 'react';
import ChildCard from '../components/ChildCard';
import './ChildPage.css';

function ChildPage({ onChildClick }) {
  const [children, setChildren] = useState([]);

  useEffect(() => {
    const apiEndpoint = `${process.env.REACT_APP_API_BASE_URL}/children`;

    fetch(apiEndpoint)
      .then((response) => response.json())
      .then((data) => setChildren(data))
      .catch((error) => console.error('Error fetching data:', error));
      
  }, []);

  return (
    <div className='main_page_container'>
      <section className='main'>
        <h2 className='child_title'>Who are you?</h2>
        {children.map((child) => (
          <ChildCard key={child.id} child={child} onClick={() => onChildClick(child)} />
        ))}
      </section>
    </div>
  );
}

export default ChildPage;
