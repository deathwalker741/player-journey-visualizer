# Frontend Setup & Development Guide

## Prerequisites

- Node.js 16+ (with npm 8+)
- Backend API running on http://localhost:8000
- Modern web browser with WebGL support

## Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and ensure:
```env
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm start
```

Opens automatically at `http://localhost:3000`

### 4. Verify Setup
1. You should see the Match Selector screen
2. Date/map filters should be visible
3. No console errors in DevTools

If matches aren't loading:
- Check backend is running at http://localhost:8000
- Verify `/health` endpoint: `curl http://localhost:8000/health`
- Check CORS configuration in backend

## ✅ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── MapViewer.tsx          # Deck.gl visualization
│   │   ├── MapViewer.module.css
│   │   ├── MatchSelector.tsx       # Match browser
│   │   └── MatchSelector.module.css
│   ├── services/
│   │   └── api.ts                 # API client
│   ├── hooks/
│   │   └── useMatchData.ts        # Custom React hooks
│   ├── App.tsx                    # Main app
│   ├── App.css
│   ├── index.tsx
│   └── react-app-env.d.ts
├── public/
│   ├── index.html
│   └── maps/                      # Minimap images
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 📦 Installing Dependencies

### What's Included
- React 18 for UI
- TypeScript for type safety
- Deck.gl for GPU-accelerated visualization
- React-Map-GL for map container
- Date-fns for date handling

### Install
```bash
npm install
```

### Verify Installation
```bash
npm test -- --listTests
```

## 🛠️ Development

### TypeScript
Strict mode enabled for safety:
```bash
npm run type-check
```

### Code Quality
```bash
# Format code
npm run format

# Lint
npm run lint
```

### Build
```bash
npm run build
```

Outputs to `build/` directory (ready for deployment)

## 🚀 Running the App

### Development Mode (with hot reload)
```bash
npm start
```

**Features:**
- Hot reloading on file changes
- Source maps for debugging
- Development tools enabled

### Production Build
```bash
npm run build
```

**Optimizations:**
- Code minification
- Tree shaking
- Asset optimization
- Source map generation

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test
```bash
npm test MapViewer
```

### Coverage Report
```bash
npm test -- --coverage
```

## 🐛 Debugging

### Browser DevTools
1. Open DevTools (F12)
2. React tab shows component tree
3. Network tab shows API calls
4. Console shows errors

### VS Code Extension
Install "React Developer Tools" extension for better debugging

### API Debugging
Log API requests:
```typescript
// In services/api.ts, add logging:
console.log('API Request:', endpoint);
console.log('Response:', data);
```

## 🎨 Styling

### CSS Modules
Component styles are scoped:
```css
/* MapViewer.module.css */
.container {
  /* Only affects MapViewer component */
}
```

### Global Styles
```css
/* App.css */
body {
  /* Affects entire app */
}
```

### Adding New Styles
1. Create `.module.css` file next to component
2. Import: `import styles from './Component.module.css'`
3. Use: `<div className={styles.className}>`

## 📱 Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Testing Responsive
1. DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Select device preset
3. Or resize browser window

## 🔌 API Integration

### Making API Calls
```typescript
import { apiClient } from '../services/api';

const matches = await apiClient.getMatches('2026-02-10');
const events = await apiClient.getMatchEvents(matchId);
const heatmap = await apiClient.getHeatmap('AmbroseValley', 'kills');
```

### Handling Errors
```typescript
try {
  const data = await apiClient.getMatches();
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly message
}
```

### Type Safety
All responses are typed:
```typescript
import { MatchListResponse, EventResponse } from '../services/api';

const response: MatchListResponse = await apiClient.getMatches();
```

## 🎯 Common Tasks

### Add a New Component
1. Create `src/components/ComponentName.tsx`
2. Create `src/components/ComponentName.module.css`
3. Export from component
4. Import and use in App.tsx

### Add API Endpoint
1. Add method to APIClient in `services/api.ts`
2. Define request/response types
3. Use in components via `apiClient.methodName()`

### Filter Events
Use the `useEventFilter` hook:
```typescript
const { filteredEvents, selectedTypes, toggleEventType } = 
  useEventFilter(events);
```

### Add Custom Hook
Create file in `src/hooks/useYourHook.ts`:
```typescript
export const useYourHook = () => {
  // Hook logic
};
```

## 📊 Performance Tips

### Memoization
```typescript
// Memoize expensive calculations
const markers = useMemo(() => {
  return events.map(e => createMarker(e));
}, [events]);
```

### Lazy Loading
```typescript
// Load components only when needed
const MapViewer = lazy(() => import('./MapViewer'));
```

### Code Splitting
Already configured in React Scripts

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```
- Automatic deployments on git push
- Environment variables in Vercel dashboard

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=build
```

### Self-Hosted
```bash
npm run build
# Upload build/ folder to server
# Configure server to serve index.html for all routes
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t player-journey-app .
docker run -p 3000:3000 player-journey-app
```

## 🔑 Environment Variables

### Required
- `REACT_APP_API_URL` - Backend API URL

### Optional
- `REACT_APP_MAPBOX_TOKEN` - Mapbox API token (for maps)
- `REACT_APP_LOG_LEVEL` - Logging verbosity

### Setting Variables
1. **Development**: Create `.env` file
2. **Build time**: `REACT_APP_VAR=value npm run build`
3. **Deployment**: Set in hosting provider dashboard

## 📚 Resources

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/)
- [Deck.gl Guide](https://deck.gl/docs)
- [Create React App Docs](https://create-react-app.dev/)

## 🆘 Troubleshooting

### Port 3000 Already in Use
```bash
# Use different port
PORT=3001 npm start
```

### Dependencies Installation Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Errors
```bash
# Check backend health
curl http://localhost:8000/health

# Verify CORS headers in response
```

### TypeScript Errors
```bash
# Check all type errors
npm run type-check
```

### Build Fails
```bash
# Check for unresolved imports
npm run build 2>&1 | head -20
```

## ✅ Pre-Deployment Checklist

- [ ] All dependencies installed
- [ ] `.env` configured correctly
- [ ] Backend API running and accessible
- [ ] TypeScript compiles without errors
- [ ] Tests pass
- [ ] Build completes successfully
- [ ] App runs in production mode
- [ ] All features tested manually

## 🎉 Ready to Launch

Frontend is production-ready when:
✅ No TypeScript errors
✅ All tests pass
✅ Build completes
✅ App loads in browser
✅ API calls succeed
✅ Visualizations render correctly

---

**Next Steps:**
1. Run `npm start` to begin development
2. Open `http://localhost:3000` in browser
3. Test match selection and visualization
4. Deploy when ready

Happy coding! 🚀
