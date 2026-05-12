const express = require("express");
const router = express.Router();

const { connectDB } = require("../../config/database");

/* Game Functionality */
router.get("/game", async (req, res) => {

  const db = await connectDB();

  // first time quiz starts
  if (!req.session.questions) {

    const questions = await db
      .collection("plants")
      .aggregate([{ $sample: { size: 5 } }])
      .toArray();

    req.session.questions = questions;
    req.session.questionNumber = 0;
    req.session.score = 0;
  }

  // finished all questions
  if (req.session.questionNumber >= 5) {
    return res.redirect("/gameresult");
  }

  const plant = req.session.questions[req.session.questionNumber];

  res.render("game", {
    plant,
    questionNumber: req.session.questionNumber + 1
  });
});

/* Correct / Wrong Answer */
router.post("/answer", (req, res) => {

  const plant = req.session.questions[req.session.questionNumber];

  const userAnswer = req.body.answer;

  const correctAnswer = plant.isEdible ? "T" : "F";

  // correct
  if (userAnswer === correctAnswer) {
    req.session.score++;
    req.session.questionNumber++;

    return res.redirect("/game");
  }

  // wrong
  req.session.wrongPlant = plant;
  req.session.questionNumber++;

  req.session.save(() => {
    res.redirect("/gameincorrect");
  });
});

/* Incorrect Page */
router.get("/gameincorrect", (req, res) => {

  const plant = req.session.wrongPlant;

  if (!plant) {
    return res.redirect("/game");
  }

  res.render("gameincorrect", {
    plant,
    questionNumber: req.session.questionNumber
  });
});

/* Next Question */
router.get("/nextquestion", (req, res) => {
  res.redirect("/game");
});

/* Results */
router.get("/gameresult", (req, res) => {

  res.render("gameresult", {
    score: req.session.score,
    total: 5
  });
});

/* Restart Quiz */
router.get("/restartquiz", (req, res) => {

  req.session.questions = null;
  req.session.questionNumber = 0;
  req.session.score = 0;

  res.redirect("/game");
});

/* Correct Screen */
router.get("/gamecorrect", (req, res) => {
  res.render("gamecorrect");
});

module.exports = router;