# Weather App - Setup & Running Guide

## Prerequisites
- Node.js v18+ installed
- npm installed

## Installation

### Step 1: Install Dependencies
```bash
cd weather
npm install
```

### Step 2: Create .env File
Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
OPENWEATHER_KEY=your_openweather_api_key_here
OPENAI_KEY=your_openai_api_key_here
PORT=5000
CORS_ORIGIN=http://localhost:3002
NODE_ENV=development
```

**Get API Keys:**
- OpenWeather API: https://openweathermap.org/api
- OpenAI API: https://platform.openai.com/api-keys

## Running the Project

### Option 1: Run Both Servers (Recommended)

**Terminal 1 - Backend:**
```bash
cd c:\Users\aiml\Documents\hemanth\weather
npm start
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd c:\Users\aiml\Documents\hemanth\weather
npm run dev
```
Frontend will run on `http://localhost:3002` (or next available port)

### Option 2: Frontend Only (Limited Features)
```bash
npm run dev
```
Frontend will load but weather API calls won't work without the backend.

## Project Structure

```
weather/
├── src/              # React frontend source
│   ├── pages/       # Page components
│   ├── components/  # UI components
│   ├── services/    # API services
│   └── lib/         # Authentication
├── server/          # Node.js backend
│   ├── index.js     # Express server
│   ├── otp-service.js    # OTP authentication
│   ├── llm-client.js     # LLM integration
│   └── cache.js     # Caching logic
├── docs/            # Documentation
├── package.json     # Dependencies
├── vite.config.ts   # Vite config
└── .env             # Environment variables (create from .env.example)
```

## Features

✅ Real-time weather data
✅ OTP-based authentication
✅ Interactive weather map
✅ Forecast charts
✅ AI weather assistant
✅ Search by city
✅ Save locations
✅ Weather history

## Troubleshooting

### Port Already in Use
If port 5000 or 3002 is in use:
- Kill the process or change PORT in `.env`
- Frontend will automatically try the next available port

### API Key Errors
- Ensure `.env` file exists in the weather directory
- Check that API keys are correct and active
- Restart both servers after updating `.env`

### Module Not Found
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
- Ensure `CORS_ORIGIN` in `.env` matches your frontend URL
- Default: `http://localhost:3002`

## API Endpoints

### Weather Endpoints
- `GET /api/forecast` - Get weather forecast
- `POST /api/qa` - Ask weather questions
- `GET /api/nowcast` - Get nowcast data
- `GET /api/alerts` - Get weather alerts

### Authentication Endpoints
- `POST /api/auth/login-otp` - Send login OTP
- `POST /api/auth/register-otp` - Send registration OTP
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/send-verification-email` - Send verification email

## Production Deployment

See `DEPLOYMENT.md` for production setup instructions.

## Support

For issues or questions, check the documentation in `/docs`:
- `OTP_VERIFICATION_GUIDE.md` - OTP authentication details
- `OTP_QUICK_REFERENCE.md` - Quick developer reference
- `IMPLEMENTATION_SUMMARY.md` - Implementation overview
