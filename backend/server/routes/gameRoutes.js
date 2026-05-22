const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware"); // Assuming you want to protect these routes

const {
  getGames,
  createGame,
  updateGame,
  deleteGame,
  addQuestionToGame,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/gameController");

// Basic CRUD for games
router.route("/")
  .get(protect, getGames)
  .post(protect, createGame);

router.route("/:id")
  .put(protect, updateGame)
  .delete(protect, deleteGame);

// Routes for questions within a game
router.route("/:gameId/questions")
  .post(protect, addQuestionToGame);

router.route("/:gameId/questions/:questionId")
  .put(protect, updateQuestion)
  .delete(protect, deleteQuestion);

module.exports = router;