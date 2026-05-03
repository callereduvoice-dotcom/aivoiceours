const { v4: uuidv4 } = require('uuid');
const telephonyService = require('./telephony');
const qualificationAgent = require('../agents/qualification');
const sheetsService = require('./sheets');
const config = require('../config');

class OutboundDialer {
  constructor() {
    this.activeCalls = new Map();
    this.campaignQueue = [];
    this.callbackBase = process.env.CALLBACK_URL || 'http://localhost:3000';
  }

  get answerUrl() {
    return `${this.callbackBase}/api/webhook/vobiz/answer`;
  }

  async makeCall(phone, language = 'hi-IN') {
    console.log(`📞 Direct call to ${phone}`);
    
    const leadData = {
      phone,
      name: 'Direct Call',
      course: 'N/A'
    };
    
    const callId = uuidv4();
    const result = await telephonyService.makeCall(phone, this.answerUrl, true);
    
    if (result.success) {
      this.activeCalls.set(callId, {
        callSid: result.callSid,
        leadData,
        startTime: Date.now(),
        status: 'initiated'
      });
      
      return { success: true, callId, callSid: result.callSid };
    }
    
    return { success: false, error: result.error };
  }

  async startCampaign(leadCount = 10) {
    console.log(`🚀 Starting campaign for ${leadCount} leads...`);
    
    const leads = await sheetsService.getLeads(2, leadCount);
    const pendingLeads = leads.filter(lead => !lead.status || lead.status === 'pending');
    
    if (pendingLeads.length === 0) {
      return { success: false, message: 'No pending leads found. Add leads to Google Sheet first.' };
    }
    
    console.log(`📋 Found ${pendingLeads.length} pending leads`);
    
    const results = [];
    for (const lead of pendingLeads.slice(0, leadCount)) {
      const result = await this.callLead(lead);
      results.push(result);
      await this.delay(2000);
    }
    
    return {
      success: true,
      totalLeads: pendingLeads.length,
      callsInitiated: results.filter(r => r.success).length,
      results
    };
  }

  async callLead(lead) {
    if (!this.isWithinOfficeHours()) {
      console.log('⏰ Outside office hours, skipping');
      return { success: false, reason: 'outside_office_hours' };
    }
    
    const callId = uuidv4();
    console.log(`📞 Calling ${lead.phone} (Call ID: ${callId})`);
    
    const result = await telephonyService.makeCall(
      lead.phone,
      this.answerUrl,
      true
    );
    
    if (result.success) {
      this.activeCalls.set(callId, {
        callSid: result.callSid,
        leadRow: lead.rowNumber,
        leadData: lead,
        startTime: Date.now(),
        status: 'initiated'
      });
      
      return { success: true, callId, callSid: result.callSid, lead };
    }
    
    return { success: false, error: result.error, lead };
  }

  async handleCallConnected(callId, callSid) {
    console.log(`✅ Call connected: ${callId}`);
    
    const callData = this.activeCalls.get(callId);
    if (!callData) {
      console.log('⚠️ Call data not found for:', callId);
      return { error: 'Call not found', callId };
    }
    
    callData.status = 'connected';
    callData.callSid = callSid;
    
    await qualificationAgent.startCall(callId, callData.leadData);
    
    return {
      callId,
      action: 'start',
      message: qualificationAgent.getIntroMessage(callData.leadData.name)
    };
  }

  async handleCallResponse(callId, input) {
    const result = await qualificationAgent.generateResponse(callId, input);
    
    if (result.action) {
      return {
        callId,
        action: result.action,
        data: result.data,
        language: result.language
      };
    }
    
    return {
      callId,
      action: 'speak',
      text: result.agentText,
      audio: result.audio
    };
  }

  async handleCallEnd(callId, status = 'completed') {
    console.log(`📴 Call ended: ${callId}, status: ${status}`);
    
    const callData = this.activeCalls.get(callId);
    if (!callData) {
      console.log('⚠️ Call data not found for end call:', callId);
      return { error: 'Call not found' };
    }
    
    const duration = Math.round((Date.now() - callData.startTime) / 1000);
    
    if (callData.leadRow) {
      await sheetsService.updateLead(callData.leadRow, {
        status: status === 'completed' ? 'called' : status,
        callDuration: `${duration}s`,
        calledAt: new Date().toISOString()
      });
    }
    
    qualificationAgent.endCall(callId);
    this.activeCalls.delete(callId);
    
    return { success: true, duration };
  }

  isWithinOfficeHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    const { start, end, days } = config.officeHours;
    
    if (!days.includes(day)) {
      return false;
    }
    
    return hour >= start && hour < end;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getActiveCalls() {
    return Array.from(this.activeCalls.entries()).map(([id, data]) => ({
      callId: id,
      ...data
    }));
  }

  getCallStatus(callId) {
    return this.activeCalls.get(callId);
  }
}

module.exports = new OutboundDialer();