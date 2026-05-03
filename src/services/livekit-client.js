const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class LiveKitClient {
  constructor() {
    this.url = process.env.LIVEKIT_URL;
    this.key = process.env.LIVEKIT_API_KEY;
    this.secret = process.env.LIVEKIT_API_SECRET;
  }
  
  getAuthHeader() {
    const auth = Buffer.from(`${this.key}:${this.secret}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
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