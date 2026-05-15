const express = require("express");
const router = express.Router();

const { ObjectId } = require("mongodb");
const { connectDB } = require("../../config/database");
const { updateStudentPoints } = require('./profile');

/* Game Functionality */
router.get("/game", async (req, res) => {

  const db = await connectDB();

  if (!req.session.questions) {

    const questions = await db
      .collection("plants")
      .aggregate([{ $sample: { size: 5 } }])
      .toArray();

    req.session.questions = questions;
    req.session.questionNumber = 0;
    req.session.score = 0;
  }

  if (req.session.questionNumber >= 5) {
    return res.redirect("/gameresult");
  }

  const plant = req.session.questions[req.session.questionNumber];

  let totalPoints = req.session.score || 0;

  if (req.session.userId) {
    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.session.userId)
    });

    if (user && user.points) {
      totalPoints = user.points + (req.session.score || 0);
    }
  }

  res.render("game", {
    plant: plant,
    questionNumber: req.session.questionNumber + 1,
    totalPoints: totalPoints
  });
});

/* Correct / Wrong Answer */
router.post("/answer", (req, res) => {

  if (!req.session.questions || req.session.questionNumber == null) {
    return res.redirect("/game");
  }

  const plant = req.session.questions[req.session.questionNumber];

  if (!plant) {
    return res.redirect("/game");
  }

  const userAnswer = req.body.answer;

  const correctAnswer = plant.isEdible ? "T" : "F";

  if (userAnswer === correctAnswer) {
    req.session.score++;
    req.session.questionNumber++;

    return res.redirect("/game");
  }

  req.session.wrongPlant = plant;
  req.session.questionNumber++;

  req.session.save(() => {
    res.redirect("/gameincorrect");
  });
});

/* Incorrect Page */
router.get("/gameincorrect", async (req, res) => {

  const db = await connectDB();

  const plant = req.session.wrongPlant;

  if (!plant) {
    return res.redirect("/game");
  }

  let totalPoints = req.session.score || 0;

  if (req.session.userId) {
    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.session.userId)
    });

    if (user && user.points) {
      totalPoints = user.points + (req.session.score || 0);
    }
  }

  res.render("gameincorrect", {
    plant: plant,
    questionNumber: req.session.questionNumber,
    totalPoints: totalPoints
  });
});

/* Next Question */
router.get("/nextquestion", (req, res) => {
  res.redirect("/game");
});

/* Results */
router.get("/gameresult", async (req, res) => {

  const db = await connectDB();

  const score = req.session.score || 0;
  const total = 5;

  if (req.session.userId && !req.session.scoreSaved) {
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.session.userId) },
      {
        $inc: {
          points: score,
          quizzesPlayed: 1
        }
      }
    );

    req.session.scoreSaved = true;
  }

  let totalPoints = score;

  if (req.session.userId) {
    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.session.userId)
    });

    if (user && user.points) {
      totalPoints = user.points;
    }
  }

  // updating the student level at the end of game
  await updateStudentPoints(req.session.email, score);


  res.render("gameresult", {
    score: score,
    total: total,
    totalPoints: totalPoints
  });
});

/* Restart Quiz */
router.get("/restartquiz", (req, res) => {

  req.session.questions = null;
  req.session.questionNumber = 0;
  req.session.score = 0;
  req.session.scoreSaved = false;

  res.redirect("/game");
});

/* Correct Screen */
router.get("/gamecorrect", (req, res) => {

  let totalPoints = req.session.score || 0;

  res.render("gamecorrect", {
    totalPoints: totalPoints,
    questionNumber: req.session.questionNumber
  });
});

module.exports = router;