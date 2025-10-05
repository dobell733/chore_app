import { useEffect, useState } from 'react';
import './ChorePage.css';
import ChoreCard from '../components/ChoreCard';
import PointCard from '../components/PointCard';

function ChorePage({ id, name }) {
  const [chores, setChores] = useState([]);
  const [totalPoints, setTotalPoints] = useState(-1);
  const [itemsPerRow, setItemsPerRow] = useState(5);

  useEffect(() => {
    // Function to update items per row
    const updateItemsPerRow = () => {
      const container = document.querySelector('.chore_container');
      if (container) {
        const containerWidth = container.offsetWidth;
        const itemWidth = 200; // Width of a single card
        const gap = 20; // Gap between cards
        const newItemsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
        setItemsPerRow(newItemsPerRow);
      }
    };

    // Initial call
    updateItemsPerRow();
    // Listen for window resize events
    window.addEventListener('resize', updateItemsPerRow);
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateItemsPerRow);
    };
  }, []);

  const actualItemCount = chores.length;
  const lastRowCount = actualItemCount % itemsPerRow;
  const dummyItemCount = lastRowCount > 0 ? itemsPerRow - lastRowCount : 0;

  useEffect(() => {
    const apiEndpoint = `${process.env.REACT_APP_API_BASE_URL}/chores/${id}`;
    
    fetch(apiEndpoint)
      .then((response) => response.json())
      .then((data) => {
        setTotalPoints(data.totalPoints);
        setChores(data.chores);
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, [id]);

  const updatePoints = (pointsToAdd) => {
    setTotalPoints(prevPoints => prevPoints + pointsToAdd);
  }

  return (
    <div className='main_page_container'>
      <section className='main'>
        <h2 className="chore_title">{name}'s Chores:</h2>
        <div className='chore_container'>
          {chores.length === 0 ? 
            <p>Loading...</p> : 
            chores.map((chore) => <ChoreCard key={chore.id} chore={chore} kid_id={id} updatePoints={updatePoints}/>)
          }
          {Array.from({ length: dummyItemCount }).map((_, index) => (
            <div key={index} className='dummy_chore_card'></div>
          ))}
        </div>
        <div className='points_container'>
          <br></br>
          <hr></hr>
          {totalPoints === -1 ? 
            <p></p> :
            <PointCard kid_id={id} kid_name={name} totalPoints={totalPoints} updatePoints={updatePoints}/>
          }
        </div>
      </section>
    </div>
  );
}

export default ChorePage;
