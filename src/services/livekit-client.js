const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class LiveKitClient {
  constructor() {
    // Convert wss:// to https:// for API calls
    let url = process.env.LIVEKIT_URL || '';
    if (url.startsWith('wss://')) {
      url = url.replace('wss://', 'https://');
    }
    this.url = url;
    this.key = process.env.LIVEKIT_API_KEY;
    this.secret = process.env.LIVEKIT_API_SECRET;
    console.log(`🔧 LiveKit API URL: ${this.url}`);
  }
  
  getAuthHeader() {
    // LiveKit uses Bearer with api_key
    return {
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json'
    };
  }
  
  async createRoom(roomName) {
    try {
      const response = await axios.post(
        `${this.url}/api/v2/rooms`,
        { name: roomName, empty_timeout: 300, max_participants: 5 },
        { headers: this.getAuthHeader() }
      );
      return { success: true, room: response.data };
    } catch (error) {
      // Room might already exist
      if (error.response?.status === 409) {
        return { success: true, message: 'Room exists' };
      }
      return { success: false, error: error.message };
    }
  }
  
  async dispatchCall(roomName, metadata) {
    try {
      // Create room first
      await this.createRoom(roomName);
      
      // Dispatch agent
      const response = await axios.post(
        `${this.url}/api/v2/agent/dispatches`,
        {
          agent_name: "sarvam-ai-agent",
          room: roomName,
          metadata: JSON.stringify(metadata)
        },
        { headers: this.getAuthHeader() }
      );
      
      console.log(`🚀 LiveKit dispatch response:`, response.data);
      return { success: true, dispatch: response.data };
    } catch (error) {
      console.error(`❌ LiveKit dispatch error:`, error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }
}

module.exports = new LiveKitClient();