const User = require("../models/user");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const initFirebaseAdmin = require("../utils/firebaseAdmin");

let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  console.log("Note: nodemailer not installed. Email sending will be mocked.");
}

const registerOtpCache = new Map();

const sendRegistrationOtp = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const userExists = await User.findOne({ email });
    const adminExists = await Admin.findOne({ email });

    if (userExists || adminExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    registerOtpCache.set(email, {
      otp: generatedOtp,
      expires: Date.now() + 10 * 60 * 1000 // 10 mins
    });

    if (nodemailer && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Email - SkillUp Hub",
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;"><h2>Verify Your Email</h2><p>Hi ${name || 'there'},</p><p>Use the following OTP to verify your email address during registration:</p><h1 style="background: #f4f4f4; padding: 15px; text-align: center; letter-spacing: 5px; border-radius: 8px; color: #333;">${generatedOtp}</h1><p>This OTP is valid for <strong>10 minutes</strong>.</p></div>`,
      };
      await transporter.sendMail(mailOptions);
    } else {
      console.log(`\n=== MOCK EMAIL ===\nTo: ${email}\nRegistration OTP: ${generatedOtp}\n==================\n`);
    }

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, otp } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const userExists = await User.findOne({ email });
    const adminExists = await Admin.findOne({ email });

    if (userExists || adminExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required for registration." });
    }

    const cached = registerOtpCache.get(email);
    if (!cached || cached.otp !== String(otp).trim() || cached.expires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
    
    registerOtpCache.delete(email);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (email === "admin@gmail.com") {
      const admin = await Admin.create({ name, email, password: hashedPassword });
      return res.status(201).json({ message: "Admin Registered Successfully", user: { ...admin.toObject(), isAdmin: true } });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    let user = await User.findOne({ email });
    let isAdmin = false;

    if (!user) {
      user = await Admin.findOne({ email });
      isAdmin = true;
    }

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Password",
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, isAdmin, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login Success",
      token,
      user: { ...user.toObject(), isAdmin },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const firebaseLogin = async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) {
      return res.status(400).json({ message: "Firebase token is required." });
    }

    const firebaseAdmin = initFirebaseAdmin();
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(firebaseToken);

    const email = decodedToken.email;
    const name = decodedToken.name || decodedToken.email?.split("@")[0] || "Firebase User";

    if (!email) {
      return res.status(400).json({ message: "Firebase token did not include an email address." });
    }

    let user = await User.findOne({ email });
    let isAdmin = false;

    if (!user) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        user = existingAdmin;
        isAdmin = true;
      }
    }

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
      });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Firebase login success",
      token,
      user: { ...user.toObject(), isAdmin },
    });
  } catch (error) {
    console.error("Firebase login error:", error);
    const message = error?.code === "auth/id-token-expired" ? "Firebase token expired." : error.message;
    res.status(401).json({ message: message || "Invalid Firebase token." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // Find all registered standard users and exclude the password field
    const users = await User.find({}).select("-password").lean();
    
    // Find all administrators and exclude the password field
    const admins = await Admin.find({}).select("-password").lean();
    const processedAdmins = admins.map(admin => ({
      ...admin,
      role: "admin",
      totalCourses: 0,
      avgProgress: 0
    }));

    try {
      // Dynamically attempt to load the Course model to calculate progress stats
      const Course = require("../models/course");
      for (let user of users) {
        const userCourses = await Course.find({
          $or: [{ userId: user._id }, { user: user._id }]
        });
        
        user.totalCourses = userCourses.length;
        const totalProgress = userCourses.reduce((acc, curr) => acc + (Number(curr.progress) || 0), 0);
        user.avgProgress = userCourses.length > 0 ? Math.round(totalProgress / userCourses.length) : 0;
      }
    } catch (err) {
      console.log("Could not load Course model for progress calculation:", err.message);
    }

    // Merge both lists so the Admin has complete visual visibility and control over all accounts
    res.status(200).json([...users, ...processedAdmins]);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    // Accept all fields from req.body except userId and password (for security)
    let updateData = { ...req.body };
    delete updateData.userId;
    delete updateData.password;

    let updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true, strict: false }
    ).select("-password").lean();

    let isAdmin = false;

    if (!updatedUser) {
      updatedUser = await Admin.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true, strict: false }
      ).select("-password").lean();
      if (updatedUser) isAdmin = true;
    }

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", user: { ...updatedUser, isAdmin } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    let deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      deletedUser = await Admin.findByIdAndDelete(id);
    }
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    let user = await User.findOne({ email }).lean();
    let isAdmin = false;
    
    if (!user) {
      user = await Admin.findOne({ email }).lean();
      isAdmin = true;
    }

    if (!user) {
      // Return a success message to prevent email enumeration
      return res.status(200).json({ message: "If your email is registered, an OTP has been sent." });
    }

    // Rate Limiting: Prevent requesting a new OTP if one was sent less than 60 seconds ago
    if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt < 60000) {
      const waitTime = Math.ceil((60000 - (Date.now() - user.lastOtpSentAt)) / 1000);
      return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting a new OTP.` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Using updateOne with strict: false to ensure the OTP saves even if it's not defined in the Schema
    const model = isAdmin ? Admin : User;
    await model.updateOne(
      { _id: user._id },
      { $set: { resetPasswordOtp: otp, resetPasswordExpires: otpExpiry, lastOtpSentAt: Date.now() } },
      { strict: false }
    );

    if (nodemailer && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail", // Can be configured to other services
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset OTP - Edujourney",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2>Password Reset Request</h2>
            <p>Hi ${user.name},</p>
            <p>You requested to reset your password. Use the following OTP to proceed:</p>
            <h1 style="background: #f4f4f4; padding: 15px; text-align: center; letter-spacing: 5px; border-radius: 8px; color: #333;">${otp}</h1>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      };
      await transporter.sendMail(mailOptions);
    } else {
      console.log(`\n=== MOCK EMAIL (No credentials config) ===\nTo: ${user.email}\nOTP: ${otp}\n==========================================\n`);
    }

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP email. Please verify your .env credentials. Details: " + error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    let user = await User.findOne({ email }).lean();
    if (!user) {
      user = await Admin.findOne({ email }).lean();
    }

    const providedOtp = otp ? String(otp).trim() : "";
    const storedOtp = user && user.resetPasswordOtp ? String(user.resetPasswordOtp).trim() : null;

    if (!user || storedOtp !== providedOtp || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required." });
    }

    // Using lean() to fetch document directly to read non-schema fields
    let user = await User.findOne({ email }).lean();
    let model = User;
    if (!user) {
      user = await Admin.findOne({ email }).lean();
      model = Admin;
    }

    const providedOtp = otp ? String(otp).trim() : "";
    const storedOtp = user && user.resetPasswordOtp ? String(user.resetPasswordOtp).trim() : null;

    if (!user || storedOtp !== providedOtp || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await model.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword }, $unset: { resetPasswordOtp: "", resetPasswordExpires: "", lastOtpSentAt: "" } },
      { strict: false }
    );

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendRegistrationOtp,
  registerUser,
  loginUser,
  firebaseLogin,
  getAllUsers,
  updateProfile,
  deleteUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
};