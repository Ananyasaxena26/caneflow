# CaneFlow

CaneFlow is a real-time sugarcane procurement queue management system. It helps farmers register, view their queue position, and receive an estimated arrival window while mill staff manage schedules, allocate tokens, and advance the daily vehicle queue.

## Features

- Farmer and mill-user authentication with JWT
- Role-based access control for farmers, mill staff, and admins
- Procurement schedules with daily vehicle capacity
- Atomic queue-token allocation with idempotency support
- Farmer queue status, vehicles ahead, and estimated arrival window
- Mill dashboard with capacity, allocation, and remaining-vehicle statistics
- Real-time dashboard updates using Socket.IO
- Queue and schedule cleanup for older records
- Express security and request logging middleware with Helmet, CORS, and Morgan

## Technology stack

- Frontend: React, React Router, Axios, Socket.IO Client
- Backend: Node.js, Express, Socket.IO, JWT, bcryptjs
- Database: MongoDB with Mongoose

## Project structure

```text
Caneflow/
├── backend/
│   ├── config/          # Database connection
│   ├── middleware/      # Authentication and role authorization
│   ├── models/          # MongoDB models
│   ├── routes/          # REST API routes
│   ├── app.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── services/
        └── socket.js
```

## Prerequisites

- Node.js 18 or later
- npm
- MongoDB running locally or a MongoDB Atlas connection

The queue endpoints use MongoDB transactions. For local development, MongoDB should run as a replica set; MongoDB Atlas works by default.

## Installation

Clone the repository and install dependencies in both applications:

```bash
git clone https://github.com/Ananyasaxena26/caneflow.git
cd caneflow

cd backend
npm install

cd ../frontend
npm install
```

## Environment variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/caneflow
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

Do not commit `.env` files or production secrets to GitHub.

## Running locally

Open two terminals from the project root.

Terminal 1 — start the backend:

```bash
cd backend
npm run dev
```

The API and Socket.IO server run at `http://localhost:5000`.

Terminal 2 — start the frontend:

```bash
cd frontend
npm start
```

The React application runs at `http://localhost:3000`.

For a production frontend build:

```bash
cd frontend
npm run build
```

## API overview

All protected endpoints use this header:

```http
Authorization: Bearer <jwt-token>
```

| Area | Base route | Purpose |
| --- | --- | --- |
| Authentication | `/api/auth` | Register, login, current-user, and admin checks |
| Schedules | `/api/schedules` | Create, list, delete, and clean up procurement schedules |
| Queue tickets | `/api/queue` | Generate tokens and view farmer queue status |
| Queue state | `/api/queue-state` | Set or advance the current queue token |
| Farmer dashboard | `/api/farmer-dashboard` | Get farmer dashboard information |
| Mill dashboard | `/api/mill-dashboard` | Get daily mill statistics |
| Farmers | `/api/farmers` | List farmers eligible for token allocation |

Health check:

```text
GET http://localhost:5000/
```

## Typical workflow

1. A farmer registers and logs in.
2. Mill staff create a procurement schedule with a service date and capacity.
3. Mill staff select an eligible farmer and generate a queue token.
4. Farmers monitor their token and estimated arrival window.
5. Mill staff advance the queue as vehicles are processed.
6. Connected dashboards receive updates in real time through Socket.IO.

## Available scripts

### Backend

- `npm start` — start the production Node.js server
- `npm run dev` — start the server with Nodemon

### Frontend

- `npm start` — start the React development server
- `npm run build` — create a production build
- `npm test` — run the React test suite

## Security notes

- Passwords are hashed with bcrypt before storage.
- JWTs protect authenticated API and Socket.IO connections.
- Role middleware restricts mill and admin operations.
- Keep `JWT_SECRET` strong and private in deployed environments.
- Configure the frontend API and Socket.IO URLs for the deployment environment instead of using localhost.

## License

This project currently does not declare a separate open-source license.
