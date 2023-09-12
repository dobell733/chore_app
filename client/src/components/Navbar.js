import React from 'react';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-flex-container">
        <div className="logo">
          <h1>Chore App</h1>
        </div>
        <ul className="nav-links">
          <li><a href="/">Home</a></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;