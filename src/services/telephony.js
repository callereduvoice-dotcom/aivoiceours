const axios = require('axios');
const config = require('../config');

class TelephonyService {
  constructor() {
    this.baseUrl = 'https://api.vobiz.ai/api/v1';
    this.authId = process.env.VOBIZ_AUTH_ID;
    this.authToken = process.env.VOBIZ_AUTH_TOKEN;
    this.fromNumber = process.env.VOBIZ_FROM_NUMBER;
  }

  getHeaders() {
    return {
      'X-Auth-ID': this.authId,
      'X-Auth-Token': this.authToken,
      'Content-Type': 'application/json'
    };
  }

  async makeCall(to, answerUrl, machineDetection = true) {
    console.log(`📞 Initiating call from ${this.fromNumber} to ${to}`);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/Account/${this.authId}/Call/`,
        {
          from: this.fromNumber,
          to: to,
          answer_url: answerUrl,
          answer_method: 'POST',
          ring_timeout: '30',
          time_limit: config.callSettings.maxDuration || '300',
          machine_detection: machineDetection ? 'true' : 'false',
          hangup_url: `${process.env.CALLBACK_URL || 'http://localhost:3000'}/api/webhook/vobiz/hangup`,
          hangup_method: 'POST'
        },
        {
          headers: this.getHeaders()
        }
      );
      
      console.log('✅ Call initiated:', response.data.request_uuid);
      return {
        success: true,
        callSid: response.data.request_uuid,
        apiId: response.data.api_id,
        status: 'initiated'
      };
    } catch (error) {
      console.error('❌ Call failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  async makeBulkCall(toNumbers, answerUrl) {
    console.log(`📞 Initiating bulk call to ${toNumbers.length} numbers`);
    
    const to = toNumbers.join('<');
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/Account/${this.authId}/Call/`,
        {
          from: this.fromNumber,
          to: to,
          answer_url: answerUrl,
          answer_method: 'POST',
          machine_detection: 'true'
        },
        {
          headers: this.getHeaders()
        }
      );
      
      return {
        success: true,
        requestUuid: response.data.request_uuid,
        apiId: response.data.api_id,
        count: toNumbers.length
      };
    } catch (error) {
      console.error('❌ Bulk call failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getCallDetails(callUuid) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/Account/${this.authId}/Call/${callUuid}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Get call details failed:', error.message);
      return null;
    }
  }

  async hangupCall(callUuid) {
    console.log(`📴 Ending call ${callUuid}`);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/Account/${this.authId}/Call/${callUuid}/hangup`,
        {},
        { headers: this.getHeaders() }
      );
      return { success: true };
    } catch (error) {
      console.error('❌ Hangup failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async transferCall(callUuid, toNumber) {
    console.log(`🔀 Transferring call ${callUuid} to ${toNumber}`);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/Account/${this.authId}/Call/${callUuid}/bridge`,
        { to: toNumber },
        { headers: this.getHeaders() }
      );
      return { success: true, callSid: response.data.call_uuid };
    } catch (error) {
      console.error('❌ Transfer failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TelephonyService();