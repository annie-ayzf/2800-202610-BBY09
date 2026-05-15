const express = require("express");
const router = express.Router();

// needed to find logged in user by MongoDB _id
const { ObjectId } = require("mongodb");

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

  // gets saved total points from user account
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
    plant,
    questionNumber: req.session.questionNumber + 1,

    // sends total saved points to yellow circle
    totalPoints: totalPoints
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
router.get("/gameincorrect", async (req, res) => {

  const db = await connectDB();

  const plant = req.session.wrongPlant;

  if (!plant) {
    return res.redirect("/game");
  }

  // gets saved total points from user account
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
    plant,
    questionNumber: req.session.questionNumber,

    // sends total saved points to incorrect page
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

  // saves score only once per quiz attempt
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

  res.render("gameresult", {
    score,
    total,
    totalPoints
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
  res.render("gamecorrect");
});

module.exports = router;