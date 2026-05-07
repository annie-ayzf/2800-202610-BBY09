const express = require("express");
const path = require("path");
const { connectDB } = require("./config/database");
require("dotenv").config();
const app = express();

//Tells express to use the views folder for ejs
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

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
      return res.send(
        "No plants found in DB — check your collection name and isEdible field",
      );
    }

    const plant = plants[0];
    res.render("gameincorrect", { plant });
  } catch (err) {
    console.error("FULL ERROR:", err); // checks your terminal
    res.status(500).send("Error: " + err.message); // show the actual error
  }
});

app.get("/profile", (req, res) => {
  res.sendFile(__dirname + "/public/profile.html");
});

app.get("/landing", (req, res) => {
  res.render("landing");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
