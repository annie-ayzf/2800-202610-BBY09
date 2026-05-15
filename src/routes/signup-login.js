const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const Joi = require("joi");
const e = require("express");
const { connectDB } = require("../../config/database");

const { createStudentLevelPoints } = require("./profile");

const saltRounds = 12;

//sign up page
router.get('/signup', (req, res) => {
    if(req.session.authenticated){
        res.redirect('/quiz');
        return;
    } else {
        res.render("signup", {error: null});
    }
  
});

router.post('/signingup', async (req, res) => {
    if(!req.body.name){
        res.render("signup", {error: "Name is required"});
        return;
    }

     if(!req.body.email){
        res.render("signup", {error: "Email is required"});
        return;
    }

     if(!req.body.password){
        res.render("signup", {error: "Password is required"});
        return;
    }

    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.object(
        {
            name: Joi.string().alphanum().max(20).required(),
            email: Joi.string().email().required(),
            password: Joi.string().max(20).required()
        }
    );

    const validationResult = schema.validate({name, email, password});

    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.redirect('/signup');
        return;
    }

    var hashedPassword = await bcrypt.hash(password, saltRounds);

    const db = await connectDB();
    const userCollection = db.collection("users");
    
    await userCollection.insertOne({name: name, email: email, password: hashedPassword});

    req.session.authenticated = true;
    req.session.name = name;
    //added for profile page use
    req.session.email = email;

    // On Signup, a record for student level is created
    await createStudentLevelPoints(email);

    res.redirect('/quiz');
    console.log("inserted user");
    
});


//Login
router.get("/login", (req, res) => {
    if (req.session.authenticated) {
        res.redirect("/quiz");
        return;
    } else {
        res.render("login", {error: null});
    }
    
});

router.post("/loggingin", async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;

    const schema = Joi.string().max(20).required();
    const validationResult = schema.validate(email);

    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.render("login", {error: "Email and password are required"});
        return;
    }

    const db = await connectDB();
    const userCollection = db.collection("users");

    const result = await userCollection.find({email: email}).project({email: 1, password: 1, name: 1, _id: 1}).toArray();

    console.log(result);

    if (result.length != 1) {
        res.render("login", {error:" Invalid email/password combination"});
        return;
    }

    if (await bcrypt.compare(password, result[0].password)) {
        console.log("correct password");
        req.session.authenticated = true;
        req.session.email = email;
        req.session.name = result[0].name;

        res.redirect('/quiz');
        return;
    } else {
        console.log("incorrect password");
        res.render("/login", {error: "Invalid email/password combination"});
    }
});

module.exports = router;

