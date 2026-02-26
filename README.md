## Seat Management System

A corporate seat booking system for managing designated and floater seats with a weekly calendar view. Employees can log in, book or release seats according to batch-based rules, and view their upcoming bookings in a modern dashboard UI.

### Tech stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT-based authentication

### Project structure

- `server/` – Express API, booking logic, auth, MongoDB models
- `client/` – React SPA, dashboard UI, booking calendar, navigation
- `mongodb-data/` – Local MongoDB data directory (ignored in git)

### Prerequisites

- Node.js (LTS)
- MongoDB running locally (or a connection string for MongoDB Atlas)

### Backend setup (`server`)

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
MONGO_URI=mongodb://localhost:27017/seat-management
JWT_SECRET=some-secure-secret
```

Run the API:

```bash
npm run dev   # or: npm start
```

The API will start on `http://localhost:5000`.

### Frontend setup (`client`)

```bash
cd client
npm install
npm run dev
```

The app will start on `http://localhost:5173` (default Vite port). It expects the API at `http://localhost:5000/api` (configured in `src/api/axios.js`).

### Development notes

- Booking rules:
  - Designated vs floater days are determined by batch and rotation logic in `server/utils/rotation.js`.
  - Designated seats can be booked for current and next week, not for past days.
  - Floater seats can be booked only for today or tomorrow, and tomorrow’s booking is allowed after 3 PM.
- The React dashboard provides:
  - Weekly calendar with legend and availability
  - Summary stats
  - My Bookings table
  - Navigation between Book seats, Bookings, and Profile pages

### Scripts

Common scripts (run from `server/` or `client/`):

- `npm run dev` – start in development mode
- `npm start` – start in production mode (where configured)

