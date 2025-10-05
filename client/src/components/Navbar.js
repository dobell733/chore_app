import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar({ onHomeClick }) {
  return (
    <nav className="navbar">
      <div className="nav-flex-container">
        <div className="logo">
          <h1>Chore App</h1>
        </div>
        <ul className="nav-links">
          <li><Link to="/" onClick={onHomeClick}>Home</Link></li>
          <li><Link to="/parent-dashboard">Parent Dashboard</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;