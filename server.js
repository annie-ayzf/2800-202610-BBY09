const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

//Express files in views folder to render ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(__dirname + "/public"));

app.get("/game", (req, res) => {
  res.render("game");
});

/*Temporary - for development purposes only,
 will be removed or linked when question is wrong*/
app.get("/gameincorrect", (req, res) => {
  res.render("gameincorrect");
});

app.get("/profile", (req, res) => {
  res.sendFile(__dirname + "/public/profile.html");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
