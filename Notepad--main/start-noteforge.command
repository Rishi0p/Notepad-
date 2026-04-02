#!/bin/bash
# ─────────────────────────────────────────────
#  NoteForge — Double-click to launch
# ─────────────────────────────────────────────

# Navigate to the project directory
cd "$(dirname "$0")"

echo "🚀 Starting NoteForge..."
echo ""

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies (first run)..."
  npm install
  echo ""
fi

# Launch the app
npm run dev

# Keep terminal open if something goes wrong
if [ $? -ne 0 ]; then
  echo ""
  echo "⚠️  NoteForge exited with an error. Press any key to close."
  read -n 1
fi
