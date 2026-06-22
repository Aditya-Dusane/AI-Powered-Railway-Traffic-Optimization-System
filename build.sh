#!/bin/bash
# RailSync AI — Render build script
# Runs each step explicitly so PATH is correct at each stage.
set -e  # exit immediately on any error

echo "==> [1/5] Installing root dependencies..."
npm install

echo "==> [2/5] Installing server dependencies..."
npm install --prefix server

echo "==> [3/5] Installing Python dependencies..."
pip install -r python/requirements.txt

echo "==> [4/5] Installing frontend dependencies..."
cd frontend
npm install

echo "==> [5/5] Building Vite frontend..."
./node_modules/.bin/vite build

echo "==> Build complete! frontend/dist is ready."
