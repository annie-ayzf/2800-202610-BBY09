const express = require("express");
const path = require("path");

const app = express();

//Tells express to use the views folder for ejs
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

const PORT = process.env.PORT || 3000;

//Express files in views folder to render ejs
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.get("/profile", (req, res) => {
  res.sendFile(__dirname + "/public/profile.html");
});

app.get('/landing', (req, res) => {
  res.render('landing');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/quiz', (req, res) => {
    res.render('quiz');
});

app.get('/game', (req, res) => {
    res.render('game');
});

app.get('/', (req, res) => {
  res.render('quiz');
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
