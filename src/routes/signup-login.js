const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Joi = require("joi");
const { connectDB } = require("../../config/database");

const { createStudentLevelPoints } = require("./profile");

const saltRounds = 12;

// Sign up page
router.get('/signup', (req, res) => {
    if (req.session.authenticated) {
        res.redirect('/quiz');
        return;
    }
    res.render("signup", { error: null });
});

router.post('/signingup', async (req, res) => {

    if (!req.body.name) {
        res.render("signup", { error: "Name is required" });
        return;
    }

    if (!req.body.email) {
        res.render("signup", { error: "Email is required" });
        return;
    }

    if (!req.body.password) {
        res.render("signup", { error: "Password is required" });
        return;
    }

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const schema = Joi.object({
        name: Joi.string().alphanum().max(20).required(),
        email: Joi.string().email().required(),
        password: Joi.string().max(20).required()
    });

    const validationResult =
        schema.validate({ name, email, password });

    if (validationResult.error) {

        console.log(validationResult.error);

        return res.redirect('/signup');
    }

    try {

        const hashedPassword =
            await bcrypt.hash(password, saltRounds);

        req.session.authenticated = true;
        req.session.name = name;
        //added for profile page use
        req.session.email = email;

        // On Signup, a record for student level is created
        await createStudentLevelPoints(email);
        const db = await connectDB();

        const userCollection =
            db.collection("users");

        const result =
            await userCollection.insertOne({
                name,
                email,
                password: hashedPassword,
                favourites: []
            });

        req.session.authenticated = true;

        req.session.name = name;

        req.session.userId =
            result.insertedId.toString();

        console.log("inserted user");

        return res.redirect('/quiz');

    } catch (err) {

        console.error(err);

        return res.render("signup", {
            error: "Server error"
        });
    }

});

// Login
router.post("/loggingin", async (req, res) => {

    const email = req.body.email;
    const password = req.body.password;

    /*Basic validation*/

    if (!email || !password) {
        return res.render("login", {
            error: "Email and password are required"
        });
    }

    try {

        const db = await connectDB();

        const userCollection = db.collection("users");

        const user = await userCollection.findOne({
            email: email
        });

        /*User not found*/

        if (!user) {
            return res.render("login", {
                error: "Invalid email/password combination"
            });
        }

        /*
        Password check
        */

        const validPassword =
            await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.render("login", {
                error: "Invalid email/password combination"
            });
        }

        /*
        Login success
        */

        req.session.authenticated = true;

        req.session.email = user.email;

        req.session.name = user.name;

        req.session.userId = user._id.toString();

        return res.redirect("/quiz");

    } catch (err) {

        console.error(err);

        return res.render("login", {
            error: "Server error"
        });
    }

});

module.exports = router;