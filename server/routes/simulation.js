const express = require('express');
const router = express.Router();
const runPython = require('../runPython');

// POST /api/simulation/run - run simulation
router.post('/run', async (req, res) => {
    try {
        const { scenario, train, station, delay, priority } = req.body;
        const result = await runPython('simulation_agent.py', {
            action: 'run',
            scenario,
            train,
            station,
            delay,
            priority
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
