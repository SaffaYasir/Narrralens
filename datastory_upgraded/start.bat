@echo off
echo.
echo  DataStory -- Starting Up...
echo.

if not exist "backend\.env" (
  echo  No .env found. Copying from .env.example...
  copy backend\.env.example backend\.env
  echo  Please edit backend\.env and add your ANTHROPIC_API_KEY, then re-run.
  pause
  exit /b 1
)

echo  Starting Flask backend...
start "DataStory Backend" cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python app.py"

timeout /t 3 /nobreak >nul

echo  Starting React frontend...
start "DataStory Frontend" cmd /k "cd frontend && npm install && npm start"

echo.
echo  DataStory is starting!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
pause
