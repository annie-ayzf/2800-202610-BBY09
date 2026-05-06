const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

//Express files in views folder to render ejs
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.get("/profile", (req, res) => {
  res.sendFile(__dirname + "/public/profile.html");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
