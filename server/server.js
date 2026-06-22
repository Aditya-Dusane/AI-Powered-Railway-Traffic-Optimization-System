const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const dashboardRouter = require('./routes/dashboard');
const schedulingRouter = require('./routes/scheduling');
const platformRouter = require('./routes/platform');
const disruptionRouter = require('./routes/disruption');
const passengerRouter = require('./routes/passenger');
const simulationRouter = require('./routes/simulation');
const monitoringRouter = require('./routes/monitoring');
const hitlRouter = require('./routes/hitl');
const auditRouter = require('./routes/audit');

// Mount routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/scheduling', schedulingRouter);
app.use('/api/platform', platformRouter);
app.use('/api/disruption', disruptionRouter);
app.use('/api/passenger', passengerRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/hitl', hitlRouter);
app.use('/api/audit', auditRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`RailSync API Server running on port ${PORT}`);
});
