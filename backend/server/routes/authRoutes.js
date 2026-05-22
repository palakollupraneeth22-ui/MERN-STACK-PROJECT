const express = require("express");
const router = express.Router();

const { registerUser, loginUser, firebaseLogin, getAllUsers, updateProfile, deleteUser, forgotPassword, verifyOtp, resetPassword, sendRegistrationOtp } = require("../controllers/authController");

// Existing routes
router.post("/register", registerUser);
router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/login", loginUser);
router.post("/firebase-login", firebaseLogin);
router.post("/google", firebaseLogin); // Added endpoint for Google Auth via Firebase

// Provide a helpful error if the frontend accidentally makes a GET request
router.get("/google", (req, res) => {
  res.status(405).json({ message: "Method Not Allowed: Please use a POST request with your Firebase token to log in." });
});

// Admin & Profile routes
router.get("/users", getAllUsers);       
router.put("/profile", updateProfile);   
router.delete("/users/:id", deleteUser); 

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
