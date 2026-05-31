#!/bin/bash
echo "🚀 Starting NarraLens..."
echo ""

# Backend
cd backend
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Created backend/.env — add your ANTHROPIC_API_KEY before continuing"
  exit 1
fi
pip install -r requirements.txt -q
python app.py &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:5000 (PID: $BACKEND_PID)"

# Frontend
cd ../frontend
npm install -q
npm start &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:3000 (PID: $FRONTEND_PID)"

echo ""
echo "📡 NarraLens is starting up..."
echo "   Open: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
