# AI Voice Agent - Education Lead Qualification

A custom-built AI voice agent for qualifying education leads in India. Supports Hindi, Tamil, Telugu, Kannada, and English with auto-language detection.

## Features

- ✅ Outbound call campaigns
- ✅ Auto language detection (5 Indian languages)
- ✅ Lead qualification (Interested/Not Interested/Callback)
- ✅ Data capture (budget, course, timing)
- ✅ Google Sheets integration
- ✅ Human transfer to your team
- ✅ Office hours filtering
- ✅ Voicemail detection

## Quick Start

### 1. Install Dependencies
```bash
cd ai-voice-agent
npm install
```

### 2. Configure Environment
Copy `.env` file and add your API keys:

```env
# Exotel (Telephony)
EXOTEL_SID=your_sid
EXOTEL_TOKEN=your_token
EXOTEL_API_KEY=your_key
EXOTEL_API_SECRET=your_secret
EXOTEL_VIRTUAL_NUMBER=+91XXXXXXXXXX

# OpenAI (LLM)
OPENAI_API_KEY=sk-xxxxx

# Google Cloud (STT)
GOOGLE_PROJECT_ID=your-project
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Azure (TTS)
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=eastus

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_CLIENT_EMAIL=your@email.com
GOOGLE_PRIVATE_KEY="your_private_key"

# Team Members (Human Transfer)
TEAM_MEMBER_1=+919999999999
TEAM_MEMBER_2=+919999999998
# ... up to 6
```

### 3. Prepare Google Sheet

Create a Google Sheet with these columns:
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| phone | name | course | source | status | interest | budget | course_interest | preferred_timing | notes | call_duration | called_at |

Row 1: Headers
Row 2+: Leads

### 4. Start Server
```bash
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/campaign/start` | POST | Start outbound campaign |
| `/api/campaign/status` | GET | Get active calls |
| `/api/leads` | GET | Get all leads |
| `/api/leads/:rowNumber` | GET | Get specific lead |
| `/api/stats` | GET | Get statistics |
| `/api/test/call` | POST | Test a call |

## Usage Examples

### Start Campaign (10 leads)
```bash
curl -X POST http://localhost:3000/api/campaign/start \
  -H "Content-Type: application/json" \
  -d '{"leadCount": 10}'
```

### Get All Leads
```bash
curl http://localhost:3000/api/leads
```

### Get Statistics
```bash
curl http://localhost:3000/api/stats
```

### Test Call
```bash
curl -X POST http://localhost:3000/api/test/call \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919999999999", "name": "Test User"}'
```

## Supported Languages

| Language | Code | TTS Voice |
|-----------|------|-----------|
| Hindi | hi-IN | hi-IN-SwaraNeural |
| Tamil | ta-IN | ta-IN-PallaviNeural |
| Telugu | te-IN | te-IN-ShrutiNeural |
| Kannada | kn-IN | kn-IN-SumaNeural |
| English | en-IN | en-IN-AishaNeural |

## Cost Estimate

| Component | Cost/min |
|-----------|----------|
| Telephony (Exotel) | ₹0.5-1 |
| STT (Google Chirp) | ₹0.3-0.5 |
| LLM (GPT-4o) | ₹0.5-1 |
| TTS (Azure) | ₹0.2-0.4 |
| **Total** | **₹1.5-2.9** |

## Architecture

```
Leads (Sheets) → Dialer → Agent → STT → LLM → TTS → Caller
                                    ↓
                             Update Sheets
                                    ↓
                            Human Transfer
```

## Troubleshooting

1. **Calls not connecting**: Check Exotel credentials and virtual number
2. **Language not detected**: Ensure text contains proper Unicode characters
3. **TTS not working**: Verify Azure credentials and region
4. **Sheets not reading**: Check service account permissions

## License

MIT