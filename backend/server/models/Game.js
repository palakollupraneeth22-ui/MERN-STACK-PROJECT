const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required.'],
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [val => val.length >= 2, 'A question must have at least 2 options.']
  },
  correctAnswer: {
    type: String,
    required: [true, 'A correct answer is required.'],
  },
});

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Game title is required.'],
    trim: true,
    unique: true,
  },
  questions: [questionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Game', gameSchema);