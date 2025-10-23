# SQL Server Monitoring Dashboard

## Overview
A real-time monitoring dashboard for SQL Server instances with performance metrics, connection tracking, and backup monitoring.

## Features
- Real-time dashboard with key performance indicators
- Performance metrics visualization
- Connection monitoring
- Backup status tracking
- Multi-instance support

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: SQL Server (monitored instances)

## Installation

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm start
```

## Configuration
1. Copy `backend/.env.example` to `backend/.env`
2. Configure SQL Server connection strings in the .env file

## Development
- Frontend runs on port 8080
- Backend API runs on port 3001

## Build
```bash
npm run build
```

## License
MIT