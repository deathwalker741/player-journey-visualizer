# Keep backend running indefinitely
Write-Host "Starting Player Journey Backend..." -ForegroundColor Green
Write-Host "Backend will run on http://0.0.0.0:8000" -ForegroundColor Cyan

& venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Write-Host "Backend process ended" -ForegroundColor Yellow
