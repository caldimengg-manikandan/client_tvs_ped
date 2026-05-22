#!/bin/bash
echo "============================================="
echo "🚀 TVS-PED SUBDIRECTORY DEPLOYMENT STARTING"
echo "============================================="

# 1. Pull the latest code
echo "📌 [1/5] Pulling latest updates from git repository..."
git pull origin main || { echo "❌ Git pull failed! Exiting..."; exit 1; }

# 2. Install any root or module dependencies
echo "📌 [2/5] Installing updated dependencies..."
npm run install-all || { echo "❌ Dependencies installation failed! Exiting..."; exit 1; }

# 3. Clean and build the frontend with subdirectory context
echo "📌 [3/5] Compiling React frontend with '/Tvs/' base path..."
cd frontend
rm -rf dist
VITE_BASE_URL=/Tvs/ VITE_API_BASE_URL=/Tvs npm run build || { echo "❌ Frontend build failed! Exiting..."; exit 1; }

# 4. Synchronize physical subdirectory structure for Nginx root
echo "📌 [4/5] Syncing compiled assets to physical subdirectory '/Tvs'..."
mkdir -p dist/Tvs
cp -r dist/assets dist/trolleys dist/favicon.jpg dist/index.html dist/tvs_logo_clean.png dist/tvs_logo_white.png dist/tvslogo.jpg dist/vite.svg dist/Tvs/ 2>/dev/null || true

# Go back to the project root directory
cd ..

# 5. Reload backend service in PM2
echo "📌 [5/5] Reloading backend server via PM2..."
pm2 reload tvs-ped-backend || pm2 restart tvs-ped-backend || {
    echo "⚠️ Backend not running in PM2. Attempting to start it..."
    cd backend
    pm2 start server.js --name "tvs-ped-backend"
    pm2 save
    cd ..
}

echo "============================================="
echo "✅ TVS-PED PRODUCTION DEPLOYMENT COMPLETE!"
echo "👉 Portal live at: https://caldimproducts.com/Tvs"
echo "============================================="
