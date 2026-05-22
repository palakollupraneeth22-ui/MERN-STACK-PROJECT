const Course = require("../models/course");
const path = require("path");
const fs = require("fs");

// UPLOAD VIDEO AND UPDATE LESSON
const uploadLessonVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded" });
    }

    const { courseId, moduleIndex, lessonIndex } = req.body;

    if (!courseId || moduleIndex === undefined || lessonIndex === undefined) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: "courseId, moduleIndex, and lessonIndex are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify user ownership
    if (course.user.toString() !== req.user.id) {
      fs.unlinkSync(req.file.path);
      return res
        .status(403)
        .json({ message: "Not authorized to update this course" });
    }

    if (
      !course.modules[moduleIndex] ||
      !course.modules[moduleIndex].lessons[lessonIndex]
    ) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Delete old video file if it exists
    const oldVideoUrl = course.modules[moduleIndex].lessons[lessonIndex]
      .videoUrl;
    if (oldVideoUrl && oldVideoUrl.startsWith("/api/videos/")) {
      const oldFilePath = path.join(
        __dirname,
        "../uploads/videos",
        oldVideoUrl.split("/").pop()
      );
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update lesson with video URL
    course.modules[moduleIndex].lessons[lessonIndex].videoUrl =
      `/api/videos/${req.file.filename}`;

    await course.save();

    res.status(200).json({
      message: "Video uploaded successfully",
      course,
      videoUrl: course.modules[moduleIndex].lessons[lessonIndex].videoUrl,
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// GET VIDEO FILE
const getVideo = async (req, res) => {
  try {
    const filename = req.params.filename;

    // Prevent directory traversal attacks
    if (filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const videoPath = path.join(
      __dirname,
      "../uploads/videos",
      filename
    );

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Get file stats for range request support
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send("Requested Range Not Satisfiable\n" + start + " >= " + fileSize);
        return;
      }

      res.status(206).header({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": "video/mp4",
      });

      fs.createReadStream(videoPath, { start, end }).pipe(res);
    } else {
      res.header({
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE LESSON VIDEO
const deleteLessonVideo = async (req, res) => {
  try {
    const { courseId, moduleIndex, lessonIndex } = req.body;

    if (!courseId || moduleIndex === undefined || lessonIndex === undefined) {
      return res.status(400).json({
        message: "courseId, moduleIndex, and lessonIndex are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify user ownership
    if (course.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this course" });
    }

    if (
      !course.modules[moduleIndex] ||
      !course.modules[moduleIndex].lessons[lessonIndex]
    ) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const videoUrl = course.modules[moduleIndex].lessons[lessonIndex]
      .videoUrl;
    if (videoUrl && videoUrl.startsWith("/api/videos/")) {
      const filePath = path.join(
        __dirname,
        "../uploads/videos",
        videoUrl.split("/").pop()
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clear video URL from lesson
    course.modules[moduleIndex].lessons[lessonIndex].videoUrl = "";

    await course.save();

    res.status(200).json({
      message: "Video deleted successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadLessonVideo,
  getVideo,
  deleteLessonVideo,
};
