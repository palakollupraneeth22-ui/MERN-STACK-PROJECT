const Game = require('../models/Game');

// @desc    Get all games
// @route   GET /api/games
// @access  Private/Admin
const getGames = async (req, res) => {
  try {
    const games = await Game.find({}).populate('createdBy', 'name email');
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching games.", error: error.message });
  }
};

// @desc    Create a game
// @route   POST /api/games
// @access  Private/Admin
const createGame = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Game title is required." });
    }

    const gameExists = await Game.findOne({ title });
    if (gameExists) {
      return res.status(400).json({ message: "A game with this title already exists." });
    }

    const game = await Game.create({
      title,
      createdBy: req.user.id,
    });

    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ message: "Server error creating game.", error: error.message });
  }
};

// @desc    Update a game
// @route   PUT /api/games/:id
// @access  Private/Admin
const updateGame = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }

    const { id } = req.params;
    const { title } = req.body;

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ message: "Game not found." });
    }

    game.title = title || game.title;
    const updatedGame = await game.save();

    res.status(200).json(updatedGame);
  } catch (error) {
    res.status(500).json({ message: "Server error updating game.", error: error.message });
  }
};

// @desc    Delete a game
// @route   DELETE /api/games/:id
// @access  Private/Admin
const deleteGame = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }

    const { id } = req.params;
    const game = await Game.findByIdAndDelete(id);

    if (!game) {
      return res.status(404).json({ message: "Game not found." });
    }

    res.status(200).json({ message: "Game deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting game.", error: error.message });
  }
};

// @desc    Add a question to a game
// @route   POST /api/games/:gameId/questions
// @access  Private/Admin
const addQuestionToGame = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }

    const { gameId } = req.params;
    const { text, options, correctAnswer } = req.body;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found." });
    }

    game.questions.push({ text, options, correctAnswer });
    await game.save();

    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ message: "Server error adding question.", error: error.message });
  }
};

// @desc    Update a question in a game
// @route   PUT /api/games/:gameId/questions/:questionId
// @access  Private/Admin
const updateQuestion = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }

    const { gameId, questionId } = req.params;
    const { text, options, correctAnswer } = req.body;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found." });
    }

    const question = game.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    question.set({ text, options, correctAnswer });
    await game.save();

    res.status(200).json(game);
  } catch (error) {
    res.status(500).json({ message: "Server error updating question.", error: error.message });
  }
};

// @desc    Delete a question from a game
// @route   DELETE /api/games/:gameId/questions/:questionId
// @access  Private/Admin
const deleteQuestion = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required." });
    }

    await Game.findByIdAndUpdate(req.params.gameId, {
      $pull: { questions: { _id: req.params.questionId } },
    });
    res.status(200).json({ message: "Question deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting question.", error: error.message });
  }
};

module.exports = {
  getGames,
  createGame,
  updateGame,
  deleteGame,
  addQuestionToGame,
  updateQuestion,
  deleteQuestion,
};