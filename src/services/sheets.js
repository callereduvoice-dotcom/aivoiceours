const { google } = require('googleapis');
const config = require('../config');

class SheetsService {
  constructor() {
    this.spreadsheetId = config.sheets.spreadsheetId;
    this.auth = null;
    this.sheets = null;
  }

  async initialize() {
    console.log('📊 Initializing Google Sheets...');
    
    try {
      this.auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets']
      );
      
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('✅ Google Sheets connected');
      return { success: true };
    } catch (error) {
      console.error('❌ Google Sheets failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getLeads(startRow = 2, maxResults = 100) {
    console.log('📥 Fetching leads from Google Sheets...');
    
    if (!this.sheets) await this.initialize();
    
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `Sheet1!A${startRow}:Z${startRow + maxResults}`
      });
      
      const rows = response.data.values || [];
      console.log(`✅ Found ${rows.length} leads`);
      
      return rows.map((row, index) => ({
        rowNumber: startRow + index,
        phone: row[0],
        name: row[1] || '',
        course: row[2] || '',
        source: row[3] || '',
        status: row[4] || 'pending',
        interest: row[5] || '',
        budget: row[6] || '',
        preferredTiming: row[7] || '',
        notes: row[8] || '',
        callDuration: row[9] || '',
        calledAt: row[10] || '',
        languageDetected: row[11] || ''
      }));
    } catch (error) {
      console.error('❌ Get leads failed:', error.message);
      return [];
    }
  }

  async updateLead(rowNumber, data) {
    console.log(`📝 Updating lead at row ${rowNumber}:`, data);
    
    if (!this.sheets) await this.initialize();
    
    try {
      const columns = ['status', 'interest', 'budget', 'course_interest', 'preferred_timing', 'notes', 'call_duration', 'called_at', 'language_detected'];
      const values = [
        data.status || '',
        data.interest || '',
        data.budget || '',
        data.courseInterest || '',
        data.preferredTiming || '',
        data.notes || '',
        data.callDuration || '',
        data.calledAt || new Date().toISOString(),
        data.languageDetected || ''
      ];
      
      const updates = columns.map((col, idx) => ({
        range: `Sheet1!${String.fromCharCode(70 + idx)}${rowNumber}`,
        values: [[values[idx]]]
      }));
      
      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: { data: updates, valueInputOption: 'USER_ENTERED' }
      });
      
      console.log(`✅ Lead updated at row ${rowNumber}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Update lead failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getLeadsByStatus(status) {
    const allLeads = await this.getLeads();
    return allLeads.filter(lead => lead.status === status);
  }

  async getNextPendingLead() {
    const allLeads = await this.getLeads();
    return allLeads.find(lead => !lead.status || lead.status === 'pending');
  }
}

module.exports = new SheetsService();