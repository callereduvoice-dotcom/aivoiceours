module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  telephony: {
    provider: 'vobiz',
    vobiz: {
      authId: process.env.VOBIZ_AUTH_ID,
      authToken: process.env.VOBIZ_AUTH_TOKEN,
      fromNumber: process.env.VOBIZ_FROM_NUMBER
    },
    exotel: {
      sid: process.env.EXOTEL_SID,
      token: process.env.EXOTEL_TOKEN,
      virtualNumber: process.env.EXOTEL_VIRTUAL_NUMBER
    }
  },
  
  sarvam: {
    apiKey: process.env.SARVAM_API_KEY
  },
  
  llm: {
    provider: 'sarvam',
    model: 'sarvam-m',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '500')
  },
  
  stt: {
    provider: 'sarvam',
    model: 'saarika:v2',
    languageCode: 'auto'
  },
  
  tts: {
    provider: 'sarvam',
    model: 'bulbul:v2',
    voiceMapping: {
      'hi-IN': 'bulbul:v2',
      'ta-IN': 'bulbul:v2',
      'te-IN': 'bulbul:v2',
      'kn-IN': 'bulbul:v2',
      'en-IN': 'bulbul:v2'
    }
  },
  
  sheets: {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:Z'
  },
  
  database: {
    url: process.env.DATABASE_URL
  },
  
  team: {
    members: [
      process.env.TEAM_MEMBER_1,
      process.env.TEAM_MEMBER_2,
      process.env.TEAM_MEMBER_3,
      process.env.TEAM_MEMBER_4,
      process.env.TEAM_MEMBER_5,
      process.env.TEAM_MEMBER_6
    ].filter(Boolean)
  },
  
  officeHours: {
    start: parseInt(process.env.OFFICE_START_HOUR || '9'),
    end: parseInt(process.env.OFFICE_END_HOUR || '18'),
    days: (process.env.OFFICE_DAYS || '1,2,3,4,5,6').split(',').map(Number)
  },
  
  callSettings: {
    maxDuration: parseInt(process.env.MAX_CALL_DURATION || '300'),
    maxRetries: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
    retryDelayMinutes: parseInt(process.env.RETRY_DELAY_MINUTES || '120'),
    voicemailDetection: process.env.VOICEMAIL_DETECTION === 'true'
  },
  
  languages: {
    default: process.env.DEFAULT_LANGUAGE || 'hi-IN',
    supported: (process.env.SUPPORTED_LANGUAGES || 'hi-IN,ta-IN,te-IN,kn-IN,en-IN').split(','),
    autoDetect: process.env.AUTO_DETECT_LANGUAGE === 'true'
  }
};