import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChildPage from './pages/ChildPage';
import ChorePage from './pages/ChorePage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import Footer from './components/Footer';
import './App.css';

function App() {
  // anytime state changes, the component will re-render
  const [showChorePage, setShowChorePage] = useState(false);
  const [child, setChild] = useState({});

  // this function gets passed down to ChildPage as props and then registers it as an onClick event on each ChildCard. So anytime a ChildCard is clicked, it will call this function and pass in the child object ie {name: Sawyer, id: 1} which will then trigger the ChorePage component to render since setShowChorePage will be set to true here. It will also pass in the child id and name to the ChorePage component as props.
  const handleChildClick = (child) => {
    setChild(child);
    setShowChorePage(true);
  };

  return (
    <Router>
      <div className='app_container'>
        <div className='nav'>
          <Navbar onHomeClick={() => { setShowChorePage(false); setChild({}); }} />
        </div>
        <div className='content'>
          <Routes>
            <Route 
              path="/" 
              element={
                showChorePage ? 
                  <ChorePage id={child.id} name={child.name} /> : 
                  <ChildPage onChildClick={handleChildClick} />
              } 
            />
            <Route path="/parent-dashboard" element={<ParentDashboardPage />} />
          </Routes>
        </div>
        <div className='footer'>
            <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;