# SQL Server Monitoring Backend

## Overview
Backend service for SQL Server monitoring, providing real-time metrics collection and API endpoints.

## Features
- Real-time metrics collection from SQL Server instances
- RESTful API endpoints
- Connection pooling
- Error handling and logging

## Installation
```bash
npm install
```

## Configuration
1. Copy `.env.example` to `.env`
2. Configure SQL Server connections:
```
SQL_SERVER_1_NAME=Production
SQL_SERVER_1_CONNECTION=mssql+pyodbc://user:pass@server:1433/database
```

## Running
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/dashboards/live` - Live dashboard data
- `GET /api/performance/live` - Performance metrics
- `GET /api/connections/live` - Connection status
- `GET /api/backups/live` - Backup status
- `GET /api/alerts` - System alerts
- `POST /api/metrics/collect` - Manual metrics collection

## Environment Variables
- `PORT` - Server port (default: 3001)
- `SQL_SERVER_X_NAME` - Instance name
- `SQL_SERVER_X_CONNECTION` - Connection string
- `COLLECTION_INTERVAL` - Metrics collection interval in minutes

## Testing
```bash
node test-connection.js
```

## License
MIT