#!/bin/bash
# Deploy script for Player Journey Visualization Tool

echo "=========================================="
echo "Player Journey Visualization Tool"
echo "Local Deployment Script"
echo "=========================================="
echo ""

echo "📍 Starting Backend Server..."
cd "c:\Users\mnage\OneDrive\Desktop\assignment Lila\player-journey-tool\backend"
Start-Process -NoNewWindow -FilePath "venv\Scripts\python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"

Start-Sleep 5

echo "📍 Installing Frontend Dependencies..."
cd "c:\Users\mnage\OneDrive\Desktop\assignment Lila\player-journey-tool\frontend"
npm install --legacy-peer-deps

echo ""
echo "✅ Backend running on http://localhost:8000"
echo "✅ Frontend ready at c:\Users\mnage\OneDrive\Desktop\assignment Lila\player-journey-tool\frontend"
echo ""
echo "To start the frontend:"
echo "  cd frontend && npm start"
