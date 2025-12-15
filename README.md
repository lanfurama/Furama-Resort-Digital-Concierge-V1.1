<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1JHp3hlytk4gyR_zr-cDEgdpefy8N2zr2

## Run Locally

**Prerequisites:**  Node.js

### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env` file (see `env-template.txt`):
   - `GEMINI_API_KEY` - Your Gemini API key (for frontend)
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database credentials

3. Run Frontend (Port 5173):
   ```bash
   npm run dev
   ```
   Frontend will be available at: http://localhost:5173

4. Run API Server (Port 3000) - in a separate terminal:
   ```bash
   npm run dev:api
   ```
   API will be available at: http://localhost:3000

### Running Both Together

You need to run both frontend and API in separate terminals:
- Terminal 1: `npm run dev` (Frontend on port 5173)
- Terminal 2: `npm run dev:api` (API on port 3000)

The frontend is configured to proxy API requests from port 5173 to port 3000 automatically.

## Build Android APK

This app can be converted to an Android APK using Capacitor.

### Quick Start

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Setup Android (automatic):
   ```powershell
   .\setup-android.ps1
   ```

3. Open Android Studio:
   ```bash
   npm run cap:open:android
   ```

4. Build APK in Android Studio:
   - **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Documentation

- 📖 **Quick Start Guide**: [BUILD_APK_QUICKSTART.md](./BUILD_APK_QUICKSTART.md)
- 📚 **Detailed Guide**: [BUILD_APK_GUIDE.md](./BUILD_APK_GUIDE.md)

### Requirements

- Node.js (v18+)
- Java JDK 17
- Android Studio
- Android SDK Platform 33+
