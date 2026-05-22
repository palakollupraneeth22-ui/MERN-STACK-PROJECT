const admin = require("firebase-admin");

const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  try {
    const serviceAccount = require("./firebase-service-account.json");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error.message);
    throw new Error("Could not initialize Firebase Admin. Please ensure firebase-service-account.json exists in the utils folder.");
  }

  return admin;
};

module.exports = initFirebaseAdmin;
