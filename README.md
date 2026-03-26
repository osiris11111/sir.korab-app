# Sir Korab - Video Learning Platform

## What this app does
Sir Korab is a premium video learning platform that helps creators master short-form content, branding, content strategy, and monetization. It features:
- **Video Lessons**: High-quality video playback with adjustable quality, speed controls, and chapter markers.
- **Progress Tracking**: Automatically saves video progress and marks videos as completed.
- **Interactive Transcripts**: Synchronized transcripts that highlight the current spoken text and allow users to follow along.
- **Category Browsing**: Organized curriculum by topic (Viral Reels, Branding, etc.).
- **Authentication & Authorization**: Secure login and role-based access control (Admin, Paid User, Free User).
- **Feedback System**: In-app reporting for video issues or suggestions.

## How to run locally
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Set up environment variables:**
   Create a `.env` file in the root directory and add the required Firebase configuration (see below).
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Build for production:**
   ```bash
   npm run build
   ```

## Folder Structure
```
/
├── src/
│   ├── components/      # Reusable UI components (Navbar, Footer, etc.)
│   ├── config/          # Configuration files and constants
│   ├── contexts/        # React context providers (AuthContext)
│   ├── pages/           # Page components (Home, Dashboard, Lesson, etc.)
│   ├── App.tsx          # Main application routing
│   ├── firebase.ts      # Firebase initialization and setup
│   ├── index.css        # Global styles and Tailwind configuration
│   └── main.tsx         # Application entry point
├── firestore.rules      # Firebase security rules
├── firebase-blueprint.json # Database schema blueprint
└── package.json         # Project dependencies and scripts
```

## Environment Variables Needed
To run this project, you will need to set up a Firebase project and provide the following environment variables in your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*(Note: In the AI Studio environment, Firebase is automatically configured via `firebase-applet-config.json`)*
