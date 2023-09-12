import React from 'react';
import './PointCard.css'; 

function PointCard({ kid_id, kid_name, totalPoints, updatePoints }) {

    const handlePayout = async () => {
        const apiEndpoint = `${process.env.REACT_APP_API_BASE_URL}/payout/${kid_id}/${kid_name}`;
        try {
            const response = await fetch(apiEndpoint, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const result = await response.json();
      
            if (result.status === 'confirmed') {
              console.log("Points reset");
              updatePoints(-totalPoints); // this is prop passed down from ChorePage. It updates the total points state in the ChorePage component which causes a re-render of the ChorePage and PointCard component itself.
            } else {
              console.log("Confirmation not received");
            }
          } catch (error) {
            console.error('Error updating chore:', error);
          }
    };

    return (
        <div className={totalPoints > 0 ? "point_card green" : "point_card red"}>
          <div className="text_container">
              {totalPoints > 1 ?
                  <div>
                      <h3>{`${kid_name}, you have ${totalPoints} points!`}</h3>
                      <h4>{`That's $${(totalPoints / 100).toFixed(2)}! 🤑`}</h4>
                      <p>Press the button when you want to get paid.</p> 
                  </div> : 
                  <div>
                      <h3>{`Oh no, ${kid_name}, you don't have any points!`}</h3>
                      <h4>Better get to work! 💪</h4>
                  </div>
              }
          </div>
          <button className={totalPoints > 0 ? 
                              'payout_button green' : 
                              'payout_button red'
                            } 
                  onClick={handlePayout} 
                  disabled={totalPoints === 0}>Get Paid! 💰
          </button>
        </div>
    );
}

export default PointCard;
