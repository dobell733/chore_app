import React, { useState, useEffect } from 'react';
import './ChoreCard.css';

function ChoreCard({ chore, kid_id, updatePoints }) {
  const [choreState, setChoreState] = useState(chore);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [formattedTime, setFormattedTime] = useState('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const unlockTime = new Date(choreState.unlock_time);
    const currentTime = new Date();

    if (currentTime > unlockTime) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);

      // Calculate time 24 hours from now
      unlockTime.setHours(unlockTime.getHours() + 24);

      let hours = unlockTime.getHours();
      const minutes = unlockTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;

      setFormattedTime(`${hours}:${minutes}${ampm} tomorrow`);
    }
  }, [choreState]);

  const handleClick = async () => {
    setButtonDisabled(true);
    setIsPending(true);
    const apiEndpoint = `${process.env.REACT_APP_API_BASE_URL}/chores/${kid_id}/${choreState.id}/${choreState.points}`;
    try {
      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result.status === 'confirmed') {
        updatePoints(choreState.points); // updates the total points in the ChorePage component which causes a re-render of the PointCard component
        setIsPending(false);
        setChoreState({
          ...choreState,
          unlock_time: result.unlock,
          is_locked: result.time,
        });
      } else {
        setButtonDisabled(false);
        setIsPending(false);
      }
    } catch (error) {
      console.error('Error updating chore:', error);
    }
  };

  return (
    <div className='chore-card-exterior'>
      <div className='chore-card-interior'>
      <h5>
        {buttonDisabled && !isPending ? '✔️' : ''}
        {choreState.name}
      </h5>
        <p>Point Value: {choreState.points}</p>
        {buttonDisabled && !isPending && <p>Locked until {formattedTime}</p>}
        {isPending && <p>Waiting for confirmation...</p>} {/* New line */}
        <button className={buttonDisabled && !isPending ? 'chore_button disabled' : 'chore_button enabled'} onClick={handleClick} disabled={buttonDisabled || isPending}>Complete Chore</button>
      </div>
    </div>
  );
}

export default ChoreCard;
