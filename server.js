const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require('dotenv').config();
const MongoStore = require('connect-mongo').default;
const session = require("express-session");


const express = require("express");
const path = require("path");
const fs = require("fs");
const { connectDB } = require("./config/database");
const app = express();

//Express files in views folder to render ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Express files in public folder to render css and images
app.use(express.static(__dirname + "/public"));
app.use("/js", express.static(path.join(__dirname, "src/js")));
app.use("/images", express.static(path.join(__dirname, "images")));

const mongoSanitize = require('express-mongo-sanitize');

const PORT = process.env.PORT || 3000;
const expireTime = 365 * 24 * 60 * 60 * 1000; //1 year

//Secret section
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_database = process.env.MONGODB_SESSION_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//hack for express 5.x not setting req.query as writable
app.use((req, _res, next) => {
  Object.defineProperty(req, "query", {
    ...Object.getOwnPropertyDescriptor(req, "query"),
    value: req.query,
    writable: true,
  });

  next();
});

app.use(
  mongoSanitize({
    replaceWith: "%",
  })
);


//create a mongoDB place to store session data
var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_session_database}`,
    crypto: {
        secret: mongodb_session_secret
    },
    ttl: 365 * 24 * 60 * 60
});

//turns on session. what allows login to be remembered
app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: expireTime
    }
}
));

//linking signup-login.js
const authRoutes = require("./src/routes/signup-login");
app.use("/", authRoutes);
//Middleware to handle form data
app.use(express.urlencoded({ extended: true }));

//Middleware to handle images of the plants
function imageToBase64(filename) {
  const filePath = path.join(__dirname, "images", filename);
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filename).slice(1);
  const data = fs.readFileSync(filePath);
  return `data:image/${ext};base64,${data.toString("base64")}`;
}

/*Temporary - for development purposes only,
 will be removed or linked when question is wrong*/
app.get("/gameincorrect", async (req, res) => {
  try {
    const db = await connectDB();

    const plants = await db
      .collection("plants")
      .aggregate([{ $match: { isEdible: false } }, { $sample: { size: 1 } }])
      .toArray();

    console.log("Plants found:", plants);
    console.log("Count:", plants.length);

    if (!plants || plants.length === 0) {
      return res.send("No plants found in DB");
    }

    const plant = plants[0];
    res.render("gameincorrect", { plant });
  } catch (err) {
    //error handling
    console.error("FULL ERROR:", err); // checks your terminal
    res.status(500).send("Error: " + err.message); // show the actual error
  }
});

app.get("/game", async (req, res) => {

  const db = await connectDB();

  // first time quiz starts
  if (!req.session.questions) {

    const questions = await db.collection("plants").aggregate([{ $sample: { size: 5 } }]).toArray();

    req.session.questions = questions;

    req.session.questionNumber = 0;

    req.session.score = 0;
  }

  // finished all questions
  if (req.session.questionNumber >= 5) {

    res.redirect("/gameresult");

    return;
  }

  const plant = req.session.questions[req.session.questionNumber];

  res.render("game", {
    plant,
    questionNumber:
      req.session.questionNumber + 1
  });
});

app.post("/answer", (req, res) => {

  const plant =
    req.session.questions[req.session.questionNumber];

  const userAnswer = req.body.answer;

  const correctAnswer =
    plant.isEdible ? "T" : "F";

  // correct answer
  if (userAnswer === correctAnswer) {

    req.session.score++;

    req.session.questionNumber++;

    res.redirect("/game");

    return;
  }

  // wrong answer
  req.session.questionNumber++;

  res.redirect("/gameincorrect");
});

app.get("/nextquestion", (req, res) => {

  res.redirect("/game");
});

app.get("/gameresult", (req, res) => {

  res.render("gameresult", {
    score: req.session.score,
    total: 5
  });
});

app.get("/restartquiz", (req, res) => {
  req.session.questions = null;
  req.session.questionNumber = 0;
  req.session.score = 0;

  res.redirect("/game");
});

// Rewards data to be passed to profile page
const rewards = [
  {
    id: "seed-option",
    value: "seed",
    pointsImg: "5PlantPoints",
    rewardImg: "Seed",
  },
  {
    id: "sprout-option",
    value: "sprout",
    pointsImg: "10PlantPoints",
    rewardImg: "Sprout",
  },
  {
    id: "seedling-option",
    value: "seedling",
    pointsImg: "15PlantPoints",
    rewardImg: "seedling",
  },
  {
    id: "youngTree-option",
    value: "youngTree",
    pointsImg: "20PlantPoints",
    rewardImg: "youngTree",
  },
  {
    id: "fruitTree-option",
    value: "fruitTree",
    pointsImg: "25PlantPoints",
    rewardImg: "fruitTree",
  },
];

//profile page to show selectable rewards
app.get("/profile", (req, res) => {
  res.render("profile", { rewards });
});

//profile modal to show the earned rewards
app.post("/profilemodal", (req, res) => {
  res.render("profilemodal");
});

app.get("/gamecorrect", (req, res) => {
  res.render("gamecorrect");
});

app.get("/gameresult", (req, res) => {

  res.render("gameresult", {
    score: req.session.score,
    total: 5
  });
});

app.get("/profilemodal", (req, res) => {
  res.render("profilemodal");
});

//if theres a session go to quiz.ejs
app.get("/", (req, res) => {
  if (req.session.authenticated) {
    res.redirect("/quiz");
    return;
  }

  res.render("index");
});

// app.get("/signup", (req, res) => {
//   res.render("signup");
// });

// app.get("/login", (req, res) => {
//   res.render("login");
// });

app.get("/quiz", (req, res) => {
  res.render("quiz");
});

app.get("/info", (req, res) => {
  res.render("info");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
