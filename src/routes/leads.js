const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Simple in-memory storage (would use DB in production)
let leads = [];

// Load leads from file on startup
const LEADS_FILE = path.join(__dirname, '../../data/leads.json');
try {
  if (fs.existsSync(LEADS_FILE)) {
    leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  }
} catch (e) {
  console.log('No existing leads file');
}

function saveLeads() {
  const dir = path.dirname(LEADS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

// GET all leads
router.get('/', (req, res) => {
  res.json({ leads, total: leads.length });
});

// POST upload leads from CSV
router.post('/upload', async (req, res) => {
  try {
    const { leads: newLeads } = req.body;
    
    if (!Array.isArray(newLeads)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    const addedLeads = newLeads.map(lead => ({
      id: uuidv4(),
      phone: lead.phone,
      name: lead.name || 'Unknown',
      language: lead.language || 'hi-IN',
      status: 'pending',
      createdAt: new Date().toISOString()
    }));
    
    // Add new leads (avoid duplicates by phone)
    const existingPhones = new Set(leads.map(l => l.phone));
    const uniqueLeads = addedLeads.filter(l => !existingPhones.has(l.phone));
    
    leads = [...leads, ...uniqueLeads];
    saveLeads();
    
    res.json({ 
      success: true, 
      added: uniqueLeads.length,
      total: leads.length,
      leads: uniqueLeads
    });
  } catch (error) {
    console.error('Lead upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST single lead
router.post('/', (req, res) => {
  const { phone, name, language } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone required' });
  }
  
  // Check if exists
  const existing = leads.find(l => l.phone === phone);
  if (existing) {
    return res.status(400).json({ error: 'Lead already exists' });
  }
  
  const lead = {
    id: uuidv4(),
    phone,
    name: name || 'Unknown',
    language: language || 'hi-IN',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  leads.push(lead);
  saveLeads();
  
  res.json({ success: true, lead });
});

// PATCH update lead status
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const lead = leads.find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  
  lead.status = status;
  lead.updatedAt = new Date().toISOString();
  saveLeads();
  
  res.json({ success: true, lead });
});

// DELETE lead
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  
  leads.splice(idx, 1);
  saveLeads();
  
  res.json({ success: true });
});

// POST clear all leads
router.delete('/', (req, res) => {
  leads = [];
  saveLeads();
  res.json({ success: true, message: 'All leads cleared' });
});

module.exports = router;