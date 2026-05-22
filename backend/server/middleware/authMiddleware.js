const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Admin = require("../models/Admin");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      // Try to find user first, then admin
      let user = await User.findById(decoded.id).select("-password");
      let isUserAdmin = decoded.isAdmin || false;
      
      if (!user && decoded.isAdmin) {
        user = await Admin.findById(decoded.id).select("-password");
        isUserAdmin = true;
      }

      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      // Convert to plain object so we can append custom authorization fields safely
      const userObj = user.toObject ? user.toObject() : user;
      userObj.isAdmin = isUserAdmin || userObj.role === "admin";
      userObj.id = userObj._id ? userObj._id.toString() : decoded.id;

      req.user = userObj;
      next();
    } catch (error) {
      return res.status(401).json({
        message: "Not Authorized",
      });
    }
  } else {
    return res.status(401).json({
      message: "No Token Provided",
    });
  }
};

module.exports = protect;