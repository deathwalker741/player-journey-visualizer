# 🎮 Interactive Controls - Quick Reference Card

## Launch the Tool
```bash
cd frontend
npm install  # First time only
npm start
```
Opens at `http://localhost:3000`

## Timeline Controls

### Play/Pause
- **Click** the play button
- **Press** Spacebar
- **Button shows**: ⏯️ during playback, ▶️ when paused

### Scrub Timeline
- **Click and drag** the slider to jump to any point
- **Display shows**: `current time / total duration` (MM:SS)
- **Auto-stops** when reaching match end

### Status
- 🔴 Pulsing dot = Currently playing
- Text shows "Playing" or "Paused"

## Filter Controls

### 1. Select Date
```
Date: [Feb 14, 2026 ▼]
```
Choose from Feb 10-14, 2026

### 2. Select Map (Optional)
```
Map: [All maps ▼]
```
Filter by map or leave blank for all

### 3. Select Match
```
Match: [Select a match... ▼]
```
Shows available matches for selected date/map

### Match Info Card
Displays when match selected:
- **Duration**: MM:SS format
- **Total Players**: Count
- **Humans vs Bots**: Split breakdown

## Visualization Controls

### Toggle Events
```
☑ Show Events
```
Show/hide event markers on map

### Toggle Journeys
```
☑ Show Journeys
```
Show/hide player paths and start positions

### Filter Event Types
```
☐ Kill          ☐ Killed
☐ Loot          ☐ KilledByStorm
```
Click checkboxes to filter which events show

## Real-time Statistics

Updates as timeline progresses:
```
Kills:      12      (Red markers)
Deaths:      8      (Black markers)
Loot:       24      (Yellow markers)
Storm:       3      (Purple markers)
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Spacebar** | Play / Pause |
| **Tab** | Navigate controls |
| **Enter** | Select dropdown option |

## Common Workflows

### Workflow 1: Quick Match Review
1. Select date
2. Select match
3. Press Spacebar to play
4. Watch in real-time

### Workflow 2: Detailed Analysis
1. Select match
2. Pause playback
3. Scrub through timeline
4. Hover on events for details
5. Filter to specific event types
6. Analyze statistics

### Workflow 3: Compare Matches
1. Watch match 1 with notes
2. Back button → Select different match
3. Watch match 2
4. Compare patterns

### Workflow 4: Track Specific Area
1. Select match
2. Pause at interesting moment
3. Scrub forward/backward slowly
4. Hover on events for details
5. Check statistics at that point

## Statistics Legend

| Stat | What It Means | Color |
|------|---------------|-------|
| **Kills** | Players eliminated by others | 🔴 Red |
| **Deaths** | This player was eliminated | ⚫ Black |
| **Loot** | Items picked up | 🟡 Yellow |
| **Storm** | Eliminated by environment | 🟣 Purple |

## Event Markers

### Event Colors
```
🔴 Kill / BotKill      - Red circle
⚫ Killed / BotKilled  - Black circle
🟡 Loot               - Yellow circle
🟣 KilledByStorm      - Purple circle
```

### Player Start Markers
```
🔵 Human player start  - Blue circle
🔵 Bot player start    - Light blue circle
```

### Hover for Details
Hover over any marker to see:
```
┌─ Kill ─────────┐
│ Player: abc1...│
│ Time: 45s      │
│ Pos: (234, 567)│
└────────────────┘
```

## Responsive Layout

### Desktop (1200px+)
- Map on left (70%)
- Controls on right (30%)
- Sidebar scrollable

### Tablet (768px-1200px)
- Map on top (60%)
- Controls on bottom (40%)
- Horizontal scroll controls

### Mobile (<768px)
- Map takes full height
- Controls collapsible sections
- Vertical scroll

## Troubleshooting

### Timeline Won't Play
- ✅ Check backend is running (port 8000)
- ✅ Check match has events loaded
- ✅ Refresh browser (Ctrl+R or Cmd+R)

### Filters Not Loading
- ✅ Check API URL in .env is correct
- ✅ Check backend health: `curl http://localhost:8000/health`
- ✅ Check browser console for errors

### Events Not Showing
- ✅ Check events checkbox is checked
- ✅ Check current timeline time > event time
- ✅ Check event type filters allow this event

### Performance Issues
- ✅ Reduce event type filters (show fewer types)
- ✅ Pause timeline and manually scrub instead
- ✅ Close other browser tabs
- ✅ Check GPU acceleration is working

## Tips & Tricks

### 💡 Tip 1: Use Spacebar
Much faster than clicking play button repeatedly

### 💡 Tip 2: Hover on Markers
Get exact timestamp and position for every event

### 💡 Tip 3: Filter Event Types
Show only kills to see combat hotspots

### 💡 Tip 4: Toggle Journeys Off
Cleaner view focused just on event markers

### 💡 Tip 5: Slow Scrubbing
Pause and slowly drag slider to see frame-by-frame progression

### 💡 Tip 6: Use Multiple Dates
Compare how gameplay evolves across different days

## Performance Expectations

| Task | Expected | Actual |
|------|----------|--------|
| Playback frame rate | 60 FPS | ✅ Smooth |
| Events displayed | 10,000+ | ✅ Smooth |
| Load match data | < 1 sec | ✅ Fast |
| Timeline scrub | Instant | ✅ Responsive |
| Filter events | < 5ms | ✅ Instant |

## File Locations

All interactive features located in:
```
frontend/src/
├── components/
│   ├── Timeline.tsx              ← Play/pause controls
│   ├── Filters.tsx               ← Match selection
│   └── MapViewerEnhanced.tsx     ← Main visualization
├── hooks/
│   └── usePlayback.ts            ← State management
└── ...
```

## Configuration

### Adjust Playback Speed
Edit `frontend/src/hooks/usePlayback.ts`:
```typescript
// Change delta multiplier (default: 1.0 for 1x speed)
const delta = (now - lastTimeRef.current) / 1000 * 2.0; // For 2x speed
```

### Change Timeline Colors
Edit `frontend/src/components/Timeline.module.css`:
```css
/* Change #667eea (purple) to your color */
.playButton {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Adjust Control Panel Width
Edit `frontend/src/components/MapViewerEnhanced.module.css`:
```css
.controlsContainer {
  width: 360px;  /* Increase for more space */
}
```

## Next Steps

### To Use the Tool
1. Start backend: `python -m uvicorn app.main:app --reload`
2. Start frontend: `npm start`
3. Select a match and play!

### To Customize
- Edit CSS files for styling
- Edit hook files for behavior
- Check INTERACTIVE_CONTROLS.md for details

### To Deploy
```bash
npm run build
# Upload build/ folder to server
```

## Documentation

- **INTERACTIVE_CONTROLS_COMPLETE.md** - Full feature guide
- **INTERACTIVE_CONTROLS.md** - Detailed documentation
- **INTERACTIVE_CONTROLS_SUMMARY.md** - Implementation summary
- **FRONTEND_SETUP.md** - Setup instructions
- **FRONTEND_IMPLEMENTATION.md** - Architecture details

## Support

**Questions?** Check:
1. Documentation files (above)
2. Code comments in source files
3. Browser DevTools console for errors

**Issues?** Try:
1. Refresh browser (Ctrl+R)
2. Restart backend API
3. Check .env configuration
4. Review browser console

---

**Status**: ✅ Ready to Use

**Time to Start**: < 1 minute after `npm start`
