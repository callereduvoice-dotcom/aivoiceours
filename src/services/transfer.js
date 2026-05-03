const config = require('../config');
const telephonyService = require('./telephony');

class TransferService {
  constructor() {
    this.teamMembers = config.team.members;
  }

  async transferToHuman(callSid, reason, summary) {
    console.log(`🔀 Transferring call ${callSid} to human agent`);
    
    const availableAgent = this.getAvailableAgent();
    
    if (!availableAgent) {
      console.log('⚠️ No available team members');
      return { success: false, error: 'No available agents' };
    }
    
    console.log(`📞 Transferring to: ${availableAgent}`);
    
    const result = await telephonyService.transferCall(callSid, availableAgent);
    
    if (result.success) {
      console.log(`✅ Successfully transferred to ${availableAgent}`);
      return {
        success: true,
        transferredTo: availableAgent,
        reason,
        summary
      };
    }
    
    return { success: false, error: result.error };
  }

  getAvailableAgent() {
    if (this.teamMembers.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * this.teamMembers.length);
    return this.teamMembers[randomIndex];
  }

  async ringAllAgents(callSid, leadInfo) {
    console.log(`📞 Ringing all agents for call ${callSid}`);
    
    const results = await Promise.all(
      this.teamMembers.map(async (phone) => {
        try {
          return await telephonyService.makeCall(
            config.telephony.exotel.virtualNumber,
            phone,
            `http://localhost:3000/api/webhook/agent?callSid=${callSid}&leadPhone=${leadInfo.phone}`
          );
        } catch (e) {
          return { success: false, phone, error: e.message };
        }
      })
    );
    
    const successful = results.filter(r => r.success).length;
    console.log(`📞 Rung ${successful}/${this.teamMembers.length} agents`);
    
    return {
      success: successful > 0,
      totalRung: successful,
      results
    };
  }

  getTeamList() {
    return this.teamMembers.map((phone, index) => ({
      id: index + 1,
      phone,
      available: true
    }));
  }
}

module.exports = new TransferService();