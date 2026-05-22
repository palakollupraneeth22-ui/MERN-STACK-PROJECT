const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: Number, default: 0 }, // Duration in minutes
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  videoUrl: { type: String, default: "" } // YouTube or video URL
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessons: [lessonSchema]
});

const studyLogSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  duration: { type: Number, required: true }, // in minutes
  notes: { type: String, default: "" } // Rich-text notes for the session
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    platform: {
      type: String,
    },

    totalHours: {
      type: Number,
      default: 0,
    },

    timeSpent: {
      type: Number,
      default: 0,
    },

    progress: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Paused", "Completed"],
      default: "Not Started",
    },

    category: {
      type: String,
      default: "General",
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    description: {
      type: String,
      default: "",
    },

    thumbnail: {
      type: String,
      default: "",
    },

    certificateId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents to have no certificateId
    },

    certificateIssuedAt: {
      type: Date,
    },

    modules: [moduleSchema],

    studyLogs: [studyLogSchema],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// AUTOMATED PROGRESS LOGGING: Calculate percentage dynamically before saving
courseSchema.pre('save', function(next) {
  if (this.modules && this.modules.length > 0) {
    let totalDuration = 0;
    let completedDuration = 0;
    let hasLessons = false;
    
    this.modules.forEach(mod => {
      if (mod.lessons && Array.isArray(mod.lessons)) {
        mod.lessons.forEach(lesson => {
          hasLessons = true;
          const duration = Number(lesson.duration) || 0;
          totalDuration += duration;
          if (lesson.completed) completedDuration += duration;
        });
      }
    });

    if (hasLessons && totalDuration > 0) {
      this.progress = Math.round((completedDuration / totalDuration) * 100);
    }
  }
  next();
});

module.exports = mongoose.model(
  "Course",
  courseSchema
);