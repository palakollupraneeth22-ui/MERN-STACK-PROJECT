const admin = require("firebase-admin");

const initFirebaseAdmin = () => {
  // Return already-initialized app to avoid re-initialization
  if (admin.apps.length > 0) {
    return admin;
  }

  try {
    let credential;

    // ── Priority 1: Use FIREBASE_SERVICE_ACCOUNT env var (for Render/production) ──
    // Set this in your Render dashboard as the entire JSON content of
    // firebase-service-account.json (paste the full JSON as a single-line string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    }
    // ── Priority 2: Use individual env vars (alternative Render setup) ──
    else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Render escapes \n in env vars — replace literal \n back to newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });
    }
    // ── Priority 3: Fall back to local JSON file (for local dev only) ──
    else {
      try {
        const serviceAccount = require("./firebase-service-account.json");
        credential = admin.credential.cert(serviceAccount);
      } catch {
        throw new Error(
          "Firebase Admin credentials not found. " +
          "Set FIREBASE_SERVICE_ACCOUNT env var on Render, or add firebase-service-account.json locally."
        );
      }
    }

    admin.initializeApp({ credential });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error.message);
    throw new Error("Could not initialize Firebase Admin: " + error.message);
  }

  return admin;
};

module.exports = initFirebaseAdmin;
