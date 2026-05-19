const express = require("express");
const router  = express.Router();
const { ObjectId }            = require("mongodb");
const { connectDB }           = require("../../config/database");
const { updateStudentPoints } = require('./profile');

/* Helper */

/**
  Calculates the points total to display in the UI.
  Refactored from three identical inline blocks in /game, /gameincorrect,
  and /gameresult: each fetched the user from the DB and added session score
  to user.points in the same way.
 
  Returns user.points (which already includes all past games) when logged in,
  otherwise falls back to the raw session score.
 */

async function getTotalPoints(db, session) {
  let total = session.score || 0;

  if (session.userId) {
    const user = await db.collection("users").findOne({
      _id: new ObjectId(session.userId)
    });
    if (user && user.points) {
      total = user.points + (session.score || 0);
    }
  }

  return total;
}

/* Game Functionality */
router.get("/game", async (req, res) => {
  const db = await connectDB();

  if (!req.session.questions) {
    const questions = await db
      .collection("plants")
      .aggregate([{ $sample: { size: 5 } }])
      .toArray();

    req.session.questions      = questions;
    req.session.questionNumber = 0;
    req.session.score          = 0;
  }

  if (req.session.questionNumber >= 5) {
    return res.redirect("/gameresult");
  }

  const plant       = req.session.questions[req.session.questionNumber];
  const totalPoints = await getTotalPoints(db, req.session);

  res.render("game", {
    plant,
    questionNumber: req.session.questionNumber + 1,
    totalPoints
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

  const userAnswer    = req.body.answer;
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
  const db    = await connectDB();
  const plant = req.session.wrongPlant;

  if (!plant) {
    return res.redirect("/game");
  }

  const totalPoints = await getTotalPoints(db, req.session);

  res.render("gameincorrect", {
    plant,
    questionNumber: req.session.questionNumber,
    totalPoints
  });
});

/* Next Question */
router.get("/nextquestion", (req, res) => {
  res.redirect("/game");
});

/* Results */
router.get("/gameresult", async (req, res) => {
  const db    = await connectDB();
  const score = req.session.score || 0;
  const total = 5;

  if (req.session.userId && !req.session.scoreSaved) {
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $inc: { points: score, quizzesPlayed: 1 } }
    );
    req.session.scoreSaved = true;
  }

  /**
   * On the results screen totalPoints should reflect the already-saved DB value
   * (not DB + session), so we fetch the user directly instead of using getTotalPoints.
   * Refactored: was an inline block identical to the others except for this distinction.
   */
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

  res.render("gameresult", { score, total, totalPoints });
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
  res.render("gamecorrect", {
    totalPoints: req.session.score || 0,
    questionNumber: req.session.questionNumber
  });
});

module.exports = router;