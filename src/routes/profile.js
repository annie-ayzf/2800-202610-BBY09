const express = require("express");
const profileRoutes = express.Router();
const { connectDB } = require("../../config/database");


// levelsInfo data to be passed to profile page
const levelsInfo = [
  {
    id: "soil-level",
    value: "soil",
    pointsImg: "0PlantPoints",
    levelVal: 0,
    pointsNeeded: 0,
    levelImg: "Soil",
    levelImgModal: "soil.svg",
    levelName: "Soil!"
  },
  {
    id: "seed-level",
    value: "seed",
    pointsImg: "5PlantPoints",
    pointsNeeded: 5,
    levelVal: 1,
    levelImg: "Seed",
    levelImgModal: "seedColor.svg",
    levelName: "Seed!"
  },
  {
    id: "sprout-level",
    value: "sprout",
    pointsImg: "10PlantPoints",
    pointsNeeded: 10,
    levelVal: 2,
    levelImg: "Sprout",
    levelImgModal: "SproutColor1.svg",
    levelName: "Sprout!"
  },
  {
    id: "seedling-level",
    value: "seedling",
    pointsImg: "15PlantPoints",
    pointsNeeded: 15,
    levelVal: 3,
    levelImg: "seedling",
    levelImgModal: "SeedlingColor.svg",
    levelName: "Seedling!"
  },
  {
    id: "youngTree-level",
    value: "youngTree",
    pointsImg: "20PlantPoints",
    pointsNeeded: 20,
    levelVal: 4,
    levelImg: "youngTree",
    levelImgModal: "youngTreeColor.svg",
    levelName: "Young Tree!"
  },
  {
    id: "fruitTree-level",
    value: "fruitTree",
    pointsImg: "25PlantPoints",
    pointsNeeded: 25,
    levelVal: 5,
    levelImg: "fruitTree",
    levelImgModal: "fruitTreeColor_1.svg",
    levelName: "Fruit Tree"
  },
];

// TODO:
/**
 * Figure out the database model - what is your json object - refer sign / sign up assignment - refer user collection
 * figure out how to do db select and show earned points dynamically in /profile page
 * 
 */

/**
 * Needed Database
 * 1) Store all the level Information
 * 2) Store student level information
 * 3) Store last time visited profile information for animation 
 * 
 */

const getStudentLevelCollection = async () => {
  const db = await connectDB();
  const studentLevelCollection = db.collection("studentLevel");
  return studentLevelCollection;
}

const getAvailableLevels = () => {
  // get all available levels
  return levelsInfo;
}

const getLevelInfo = (id) => {
  return getAvailableLevels().filter((levelInfo) => levelInfo.id === id);
}


const createStudentLevelPoints = async (studentEmail) => {
  try {
    // first time when a student profile is created
    const studentLevelInfo = {
      studentEmail,
      levelInfo: getLevelInfo("soil-level")[0], // first level
      points: 0,
      treesGrown: 0
    }

    await (await getStudentLevelCollection()).insertOne(studentLevelInfo);

    console.log("Student level info initialized!");

  } catch (err) {
    console.log(err);
  }
}

const getLevelInfoUsingLevelVal = (levelVal) => {
  return getAvailableLevels().filter((levelInfo) => levelInfo.levelVal == levelVal)[0];
}

const getStudentLevelInfo = async (studentEmail) => {
  const studentLevelRes = await (await getStudentLevelCollection()).findOne({ studentEmail });
  return studentLevelRes;
}

const updateStudentPoints = async (studentEmail, pointNeedToBeUpdated) => {
  /**
   * 1) Get the student points and current level information
   * 2) Add pointNeedToBeUpdated with the student points and see level up is possible
   * 3) Increase the level (change the current level) up and points accordingly
   */
  const currStudentLevelData = await getStudentLevelInfo(studentEmail);

  // updatable fields
  let newPoints = 0;
  let newTreesGrown = currStudentLevelData.treesGrown; // get the existing trees
  let newLevelInfo;

  let currentPoints = currStudentLevelData.points;
  let updatedPoints = pointNeedToBeUpdated + currentPoints;


  let currentLevel = currStudentLevelData.levelInfo.levelVal;

  let nextLevel = currentLevel + 1;

  if (nextLevel > getAvailableLevels().length) {
    let pointsToFinishCurrentLevel = currStudentLevelData.levelInfo.pointsNeeded;
    // Finishing the last level, one loop completion
    if (updatedPoints >= pointsToFinishCurrentLevel) {
      newTreesGrown += 1;

      let residuePoints = updatedPoints - pointsToFinishCurrentLevel;
      newPoints = residuePoints;

      newLevelInfo = getLevelInfoUsingLevelVal(1); // start from seed

    } else {
      newPoints = updatedPoints;
      newLevelInfo = currStudentLevelData.levelInfo; // User is still on the same level
    }
  } else {
    const nextLevelInfo = getLevelInfoUsingLevelVal(nextLevel);
    let pointsToNextLevel = nextLevelInfo.pointsNeeded;

    if (updatedPoints >= pointsToNextLevel) {
      const residuePoints = updatedPoints - pointsToNextLevel;
      newPoints = residuePoints;
      newLevelInfo = nextLevelInfo;
    } else {
      newPoints = updatedPoints;
      newLevelInfo = currStudentLevelData.levelInfo; // User is still on the same level
    }
  }


  const updateResult = await (await getStudentLevelCollection()).updateOne(
    { studentEmail },          // Filter criteria (find this student)
    {
      $set:
      {
        levelInfo: newLevelInfo,
        treesGrown: newTreesGrown,
        points: newPoints,
      }
    }   // Update operation (change or add fields)
  );
}

const storeLastVisitedState = (studentEmail, lastSeenLevelID, lastLevelVal) => {
  // store this in database (Advanced)
  return true;
}


const getLastVisitedState = (studentEmail) => {
  // get Last Visited State
  return {
    lastSeenLevelID: "sprout-level",
    levelVal: 1,
    lastVisitedTime: Date.UTC()
  }
}




//profile page to show selectable rewards
profileRoutes.get("/", async (req, res) => {
  if (!req.session.email) {
    return res.redirect("/signup");
  }
  // get level info from table
  const studentEmail = req.session.email;
  const currStudentLeveldata = await getStudentLevelInfo(studentEmail);
  const lastVisitedState = getLastVisitedState(studentEmail);


  // persist the visited time and current level at the time of visiting
  let animator = false;
  console.log(currStudentLeveldata);

  if (currStudentLeveldata.levelInfo.levelVal > lastVisitedState.levelVal) {
    animator = true;
  }

  storeLastVisitedState(studentEmail, currStudentLeveldata.levelInfo.id, currStudentLeveldata.levelInfo.levelVal);

  res.render(
    "profile",
    {
      levelsInfo,
      levelImgModal: currStudentLeveldata.levelInfo.levelImgModal,
      levelName: currStudentLeveldata.levelInfo.levelName,
      animator,
      // Bind actual live values from the student's database document
      userLevel: currStudentLeveldata.levelInfo.levelVal,
      earnedPoints: currStudentLeveldata.points,
      treesCollected: currStudentLeveldata.treesGrown
    }
  );

});

module.exports = {
  profileRoutes,
  createStudentLevelPoints,
  updateStudentPoints,
}