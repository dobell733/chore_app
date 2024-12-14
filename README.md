# Chore App

I created this simple web application to help manage my kid's chores and allow them to earn points and incentivize good habits 😊

## Features

- **Child Accounts**: Each child has their own profile with unique chores and point tracking.
- **Chore Management**: Parents have access to Discord channel to approve completion before points are recorded. Chores are locked for predefined amounts of time before they can be completed again.
- **Point System**: Children earn points for completing chores. Points are converted into dollars, with payouts managed through a Discord bot integration as well.
- **Responsive Design**: User-friendly interface with support for desktop and mobile devices.

## Tech Stack

- **Frontend**: React.js with custom components styled using CSS.
- **Backend**: Node.js with Express for API endpoints.
- **Database**: Postgres SQL database running on Digital Ocean Droplet for storing user data and chore details.
- **Integration**: Discord bot for confirmation workflows and notifications.

## Project Structure
### Frontend
- components/: Contains reusable UI components such as ChoreCard, ChildCard, and PointCard.
- pages/: Pages like ChildPage and ChorePage for navigation.
- App.js: Main entry point for the React app.
### Backend
- server/index.js: Express server and API routes.
- database/db.js: Contains database connection and query logic.
### API Endpoints
- GET /children: Fetch all children.
- GET /chores/:id: Fetch all chores for a child.
- PUT /chores/:kid_id/:chore_id/:chore_points: Mark a chore as completed.
- PUT /payout/:kid_id/:kid_name: Payout points to a child.

## Future Improvements
- I would eventually like to add something in the interface that allows for the modification of chores for each child so that it doesn't require logging in and modifying the database tables directly.
