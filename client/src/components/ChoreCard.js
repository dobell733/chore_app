import React, { useState, useEffect } from 'react';
import './ChoreCard.css';

function ChoreCard({ chore, kid_id, updatePoints }) {
  const [choreState, setChoreState] = useState(chore);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [formattedTime, setFormattedTime] = useState('');
  const [isPending, setIsPending] = useState(false);

  const formatTimeDifference = (unlockTime, currentTime) => {
    const diffInMilliseconds = unlockTime - currentTime;
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (diffInHours >= 24) {
      return `${Math.floor(diffInHours / 24)} days ${diffInHours % 24} hours ${diffInMinutes} minutes`;
    } else {
      return `${diffInHours} hours ${diffInMinutes} minutes`;
    }
  };

  useEffect(() => {
    const updateLockStatus = () => {
      const unlockTime = new Date(choreState.unlock_time);
      const currentTime = new Date();

      if (currentTime > unlockTime) {
        setButtonDisabled(false);
      } else {
        setButtonDisabled(true);
        const timeDifference = formatTimeDifference(unlockTime, currentTime);
        setFormattedTime(`Locked for ${timeDifference}`);
      }
    };

    // Update immediately
    updateLockStatus();

    // Update every minute
    const intervalId = setInterval(updateLockStatus, 60000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
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
        updatePoints(choreState.points);
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
        {buttonDisabled && !isPending && <p>{formattedTime}</p>}
        {isPending && <p>Waiting for confirmation...</p>}
        <button className={buttonDisabled && !isPending ? 'chore_button disabled' : 'chore_button enabled'} onClick={handleClick} disabled={buttonDisabled || isPending}>Complete Chore</button>
      </div>
    </div>
  );
}

export default ChoreCard;
