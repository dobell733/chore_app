import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ChildPage from './pages/ChildPage';
import ChorePage from './pages/ChorePage';
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
    <div className='app_container'>
      <div className='nav'>
        <Navbar />
      </div>
      <div className='content'>
        {showChorePage ? 
          <ChorePage id={child.id} name={child.name} /> : 
          <ChildPage onChildClick={handleChildClick} /> 
        }
      </div>
      <div className='footer'>
          <Footer />
      </div>
    </div>
  );
}

export default App;
