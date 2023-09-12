import React from 'react';
import './ChildCard.css';

function ChildCard({ child, onClick }) {
  return (
    <div className="child_card" onClick={() => onClick(child)}>
      <div className="child_content">
        <h3>{child.name}</h3>
      </div>
    </div>
  );
}

export default ChildCard;
