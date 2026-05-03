const express = require('express');
const router = express.Router();
const sheetsService = require('../services/sheets');
const dialer = require('../services/dialer');

router.get('/', async (req, res) => {
  try {
    const leads = await sheetsService.getLeads(2, 1000);
    
    const stats = {
      total: leads.length,
      byStatus: {
        pending: leads.filter(l => !l.status || l.status === 'pending').length,
        called: leads.filter(l => l.status === 'called').length,
        connected: leads.filter(l => l.status === 'connected').length,
        voicemail: leads.filter(l => l.status === 'voicemail').length,
        noAnswer: leads.filter(l => l.status === 'no_answer').length
      },
      byInterest: {
        interested: leads.filter(l => l.interest === 'interested').length,
        notInterested: leads.filter(l => l.interest === 'not_interested').length,
        callback: leads.filter(l => l.interest === 'callback').length,
        dnc: leads.filter(l => l.interest === 'dnc').length
      },
      byLanguage: {},
      activeCalls: dialer.getActiveCalls().length
    };
    
    leads.forEach(lead => {
      if (lead.languageDetected) {
        stats.byLanguage[lead.languageDetected] = (stats.byLanguage[lead.languageDetected] || 0) + 1;
      }
    });
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', (req, res) => {
  const activeCalls = dialer.getActiveCalls();
  
  res.json({
    activeCalls: activeCalls.length,
    lastUpdated: new Date().toISOString()
  });
});

module.exports = router;