const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const uploadVideo = require("../middleware/uploadMiddleware");

const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCertificate,
  importYoutubePlaylist,
  addModule,
  updateModuleOrder,
  deleteModule,
  addLesson,
  updateLesson,
  updateLessonOrder,
  deleteLesson,
  verifyCertificate
} = require("../controllers/courseController");

const {
  uploadLessonVideo,
  deleteLessonVideo,
} = require("../controllers/videoController");

// GET + CREATE
router
  .route("/")
  .get(protect, getCourses)
  .post(protect, createCourse);

// YouTube Import
router.post("/import-youtube", protect, importYoutubePlaylist);

// Video Upload for Lesson
router.post("/upload-video", protect, uploadVideo.single("video"), uploadLessonVideo);

// Video Delete
router.delete("/delete-video", protect, deleteLessonVideo);

// GET CERTIFICATE
router.get("/:id/certificate", protect, getCertificate);

// VERIFY CERTIFICATE (Public Route)
router.get("/verify/:certificateId", verifyCertificate);

// MODULE ROUTES
router.post("/:courseId/modules", protect, addModule);
router.put("/:courseId/modules/reorder", protect, updateModuleOrder);
router.delete("/:courseId/modules/:moduleId", protect, deleteModule);

// LESSON ROUTES
router.post("/:courseId/modules/:moduleId/lessons", protect, addLesson);
router.put("/:courseId/modules/:moduleId/lessons/reorder", protect, updateLessonOrder);
router.put("/:courseId/modules/:moduleId/lessons/:lessonId", protect, updateLesson);
router.delete("/:courseId/modules/:moduleId/lessons/:lessonId", protect, deleteLesson);

// UPDATE + DELETE + GET ONE
router
  .route("/:id")
  .get(protect, getCourseById)
  .put(protect, updateCourse)
  .delete(protect, deleteCourse);

module.exports = router;