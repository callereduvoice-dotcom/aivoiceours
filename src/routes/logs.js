const express = require('express');
const router = express.Router();

// Simple in-memory log store
const logs = [];
const MAX_LOGS = 1000;

function addLog(level, source, message, details = '') {
  const entry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    level,  // info, warn, error, success
    source, // server, telephony, agent, api
    message,
    details
  };
  logs.unshift(entry); // Add to beginning
  if (logs.length > MAX_LOGS) logs.pop();
  return entry;
}

// Log from any part of the app
router.post('/', (req, res) => {
  const { level, source, message, details } = req.body;
  addLog(level || 'info', source || 'client', message, details);
  res.json({ success: true });
});

// Get all logs
router.get('/', (req, res) => {
  const { level, source, limit } = req.query;
  let filtered = [...logs];
  
  if (level) {
    filtered = filtered.filter(l => l.level === level);
  }
  if (source) {
    filtered = filtered.filter(l => l.source === source);
  }
  
  const max = parseInt(limit) || 100;
  res.json({ logs: filtered.slice(0, max), total: filtered.length });
});

// Clear logs
router.delete('/', (req, res) => {
  logs.length = 0;
  res.json({ success: true, message: 'Logs cleared' });
});

// Get stats (for dashboard)
router.get('/stats', (req, res) => {
  const recentLogs = logs.slice(0, 100);
  res.json({
    total: logs.length,
    byLevel: {
      info: logs.filter(l => l.level === 'info').length,
      success: logs.filter(l => l.level === 'success').length,
      warn: logs.filter(l => l.level === 'warn').length,
      error: logs.filter(l => l.level === 'error').length
    },
    recent: recentLogs
  });
});

module.exports = { router, addLog };
module.exports.addLog = addLog;