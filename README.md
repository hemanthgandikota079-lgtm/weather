# 🌦️ Weather Forecast App

A modern, feature-rich weather dashboard with AI-powered insights, real-time data visualization, and user authentication. Built with React, TypeScript, and powered by OpenWeatherMap API.

**Live Demo:** [Deploy your app](./DEPLOYMENT.md)

---

## ✨ Features

### Core Weather Features
- 🌡️ **Real-time Weather Data** - Live temperature, humidity, pressure, wind speed, and visibility from OpenWeatherMap API
- 🎨 **Dynamic Theming** - UI automatically changes colors and styling based on current weather conditions (rain, snow, clear, storms, etc.)
- 📍 **City Search** - Search weather for any location worldwide with instant results
- 📊 **Detailed Metrics** - Air quality index (AQI), UV index, visibility, dew point, and more
- 🌅 **Sun Information** - Sunrise and sunset times with animated indicators
- 💨 **Wind Analysis** - Wind speed, direction with arrow indicators, and gust information

### Advanced Features
- 🤖 **AI Weather Insights** - LLM-powered weather summaries and intelligent Q&A using voice input
- 🎤 **Voice Interface** - Speak your weather questions, get audio responses powered by Web Speech API
- 📈 **Weather Forecasts** - 5-day forecast with interactive charts and trends
- 🗺️ **Interactive Map** - Dynamic Leaflet map centered on current location with markers
- ⚠️ **Real-time Alerts** - Weather alerts and warnings from meteorological services

### User Management
- 🔐 **Authentication** - Email/password signup and login with secure password validation
- 🔑 **Google OAuth** - One-click sign-in with Google accounts
- 💾 **Saved Locations** - Bookmark favorite cities for quick access
- 📜 **Search History** - Auto-tracked search history (up to 8 recent searches)
- 👤 **User Profiles** - Persistent user data and preferences

### Design & Experience
- ✨ **Smooth Animations** - Framer Motion animations and GSAP effects
- 🌙 **Dark Theme** - Premium dark UI optimized for readability and eye comfort
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- 🎯 **Intuitive Navigation** - Clean multi-page routing with breadcrumb navigation

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework with custom configuration
- **Vite** - Lightning-fast build tool and dev server
- **Framer Motion** - Declarative animations
- **GSAP** - Advanced animation library
- **Lucide React** - Beautiful, consistent icon library
- **React Router DOM** - Client-side routing

### Visualization & Mapping
- **Chart.js** - Interactive data visualization
- **React Chart.js 2** - React wrapper for Chart.js
- **Leaflet** - Interactive maps
- **React Leaflet** - React components for Leaflet

### Backend & API
- **Express.js** - Node.js web framework
- **Node Fetch** - API client for external requests
- **Dotenv** - Environment variable management

### APIs & Services
- **OpenWeatherMap API** - Weather data and forecasts
- **Firebase** - Authentication and data persistence
- **LLM Integration** - AI-powered weather insights and Q&A

---

## 📁 Project Structure

```
weather/
├── src/
│   ├── App.tsx                 # Main app component with routing
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   ├── types.ts                # TypeScript type definitions
│   ├── components/
│   │   ├── AIWidget/
│   │   │   ├── AIWidget.tsx    # AI features (chat, voice, alerts)
│   │   │   └── styles.css
│   │   ├── ForecastChart.tsx   # 5-day forecast visualization
│   │   ├── MetricTile.tsx      # Reusable metric display
│   │   ├── SectionCard.tsx     # Card wrapper component
│   │   └── WeatherMap.tsx      # Interactive Leaflet map
│   ├── pages/
│   │   ├── HomePage.tsx        # Main weather dashboard
│   │   ├── LoginPage.tsx       # Auth (login/register)
│   │   ├── SavedLocationsPage.tsx  # Bookmarked cities
│   │   └── HistoryPage.tsx     # Recent searches
│   ├── services/
│   │   └── weatherService.ts   # API calls to OpenWeatherMap
│   └── lib/
│       ├── auth.ts             # Firebase authentication
│       ├── firebase.ts         # Firebase config
│       └── aiClient.ts         # LLM client for AI features
├── server/
│   ├── index.js                # Express server entry
│   ├── cache.js                # Response caching logic
│   ├── llm-client.js           # LLM API integration
│   └── nowcast.js              # Real-time weather nowcasting
├── public/
│   └── index.html              # HTML template
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
├── vercel.json                 # Vercel deployment config
└── DEPLOYMENT.md               # Deployment guide
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16.0 or higher
- **npm** or **yarn** package manager
- **OpenWeatherMap API Key** (free tier available at [openweathermap.org](https://openweathermap.org/api))
- **Firebase Project** (for authentication)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/weather.git
cd weather
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

4. **Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (HMR enabled) |
| `npm run build` | Compile TypeScript and build for production |
| `npm run preview` | Preview production build locally |
| `npm start` | Start Express backend server |

---

## 🔌 API Documentation

### Frontend API Endpoints

#### Weather Data
- `GET /api/weather?city={cityName}` - Get current weather
- `GET /api/forecast?lat={lat}&lon={lon}` - Get weather forecast
- `GET /api/alerts?lat={lat}&lon={lon}` - Get weather alerts
- `GET /api/nowcast?lat={lat}&lon={lon}` - Get real-time nowcast data

#### AI Features
- `POST /api/qa` - Ask weather questions
  ```json
  {
    "lat": 40.7128,
    "lon": -74.0060,
    "question": "What's the weather like today?"
  }
  ```

#### Response Caching
All API responses are cached server-side to improve performance and reduce API costs.

---

## 🔐 Authentication

### Email/Password
- User registration with strong password validation (minimum 8 characters)
- Secure login with Firebase Authentication
- Password strength indicator on signup

### Google OAuth
- One-click sign-in with Google accounts
- Automatic profile creation
- Account linking support

### Session Management
- Auth tokens stored in localStorage
- Automatic logout on token expiration
- Protected routes (redirects to login if not authenticated)

---

## 🎯 Key Features in Detail

### Dynamic Weather Theming
The app automatically adapts its theme based on weather conditions:
- ☀️ **Clear** - Warm golden gradient
- ☁️ **Clouds** - Cool gray tones
- 🌧️ **Rain** - Deep blue with cyan accents
- ⛈️ **Thunderstorm** - Dark purple gradient
- ❄️ **Snow** - Light blue with frosted effects
- 🌫️ **Fog/Mist** - Muted gray palette

### AI-Powered Weather Insights
- LLM-generated weather summaries
- Conversational Q&A about weather data
- Real-time alert notifications
- Voice input support with speech recognition
- Audio output with text-to-speech

### Interactive Forecasting
- 5-day weather forecast with interactive charts
- Hourly breakdown (where available)
- Trend analysis with visual indicators
- Temperature, precipitation, and wind speed graphs

---

## 🌐 Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy to Vercel
```bash
npm install -g vercel
vercel
```

The project is configured for Vercel with `vercel.json`

---

## 🎨 Customization

### Changing Theme Colors
Edit `tailwind.config.js` to customize the Tailwind color scheme:
```javascript
theme: {
  extend: {
    colors: {
      // Custom colors here
    }
  }
}
```

### Adding Weather Conditions
Modify the `weatherThemes` object in `src/App.tsx` to add new weather-based themes.

---

## 📱 Browser Support

- ✅ Chrome (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (latest 2 versions)
- ⚠️ Mobile browsers (iOS Safari, Chrome Mobile)

**Note:** Voice features require browser support for Web Speech API (Chrome, Edge, Safari)

---

## 🐛 Troubleshooting

### API Key Issues
- Verify API key is valid and has required permissions
- Check API rate limits
- Ensure `.env` file is in root directory

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port Already in Use
```bash
# Change port in vite.config.ts or use:
npm run dev -- --port 3000
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- **OpenWeatherMap** - Weather data and APIs
- **Firebase** - Authentication and database services
- **React Community** - Incredible ecosystem and tools
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Beautiful icon library

---

## 📞 Support

For issues, questions, or suggestions:
- Open an [GitHub Issue](https://github.com/yourusername/weather/issues)
- Check existing issues for solutions
- Contact: [your-email@example.com]

---

**Happy weather forecasting! 🌦️**

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Build for Production

```bash
npm run build
```

The optimized production files will be in the `dist` folder.

## Deployment

The app can be deployed to any static hosting service:

- **Vercel** (recommended)
  ```bash
  npm install -g vercel
  vercel
  ```

- **Netlify**
  - Connect your GitHub repo to Netlify
  - Set build command: `npm run build`
  - Set publish directory: `dist`

- **GitHub Pages**
  - Update `vite.config.ts` with base path if needed
  - Run `npm run build`
  - Deploy the `dist` folder

## API

This app uses the [OpenWeatherMap API](https://openweathermap.org/api) for weather data.

Currently uses a free API key. For production, consider using environment variables to secure the API key.

## Project Structure

```
weather/
├── src/
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # React entry point
│   └── index.css         # Global styles
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
├── tailwind.config.js    # Tailwind config
└── postcss.config.js     # PostCSS config
```

## License

MIT
