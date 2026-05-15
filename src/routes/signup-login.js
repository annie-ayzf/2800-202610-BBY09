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

// router.post('/signingup', async (req, res) => {
//     if (!req.body.name) {
//         res.render("signup", { error: "Name is required" });
//         return;
//     }
//     if (!req.body.email) {
//         res.render("signup", { error: "Email is required" });
//         return;
//     }
//     if (!req.body.password) {
//         res.render("signup", { error: "Password is required" });
//         return;
//     }

//     var name = req.body.name;
//     var email = req.body.email;
//     var password = req.body.password;

//     const schema = Joi.object({
//         name: Joi.string().alphanum().max(20).required(),
//         email: Joi.string().email().required(),
//         password: Joi.string().max(20).required()
//     });

//     const validationResult = schema.validate({ name, email, password });
//     if (validationResult.error != null) {
//         console.log(validationResult.error);
//         res.redirect('/signup');
//         return;
//     }

//     var hashedPassword = await bcrypt.hash(password, saltRounds);
//     const db = await connectDB();
//     const userCollection = db.collection("users");

//     // FIX 1: capture the result so we have the inserted _id
//     const result = await userCollection.insertOne({
//         name: name,
//         email: email,
//         password: hashedPassword,
//         favourites: []
//     });

//     req.session.authenticated = true;
//     req.session.name = name;
//     req.session.userId = result[0]._id.toString();

//     res.redirect('/quiz');
//     console.log("inserted user");
// });

// Login
router.post("/loggingin", async (req, res) => {

    const email = req.body.email;
    const password = req.body.password;

    /*
    Basic validation
    */

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

        /*
        User not found
        */

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
// router.get("/login", (req, res) => {
//     if (req.session.authenticated) {
//         res.redirect("/quiz");
//         return;
//     }
//     res.render("login", { error: null });
// });

// router.post("/loggingin", async (req, res) => {
//     var email = req.body.email;
//     var password = req.body.password;

//     const schema = Joi.string().max(20).required();
//     const validationResult = schema.validate(email);
//     if (validationResult.error != null) {
//         console.log(validationResult.error);
//         res.render("login", { error: "Email and password are required" });
//         return;
//     }

//     const db = await connectDB();
//     const userCollection = db.collection("users");
//     const result = await userCollection.find({ email: email })
//         .project({ email: 1, password: 1, name: 1, _id: 1 })
//         .toArray();

//     console.log(result);

//     if (result.length != 1) {
//         res.render("login", { error: "Invalid email/password combination" });
//         return;
//     }

//     if (await bcrypt.compare(password, result[0].password)) {
//         console.log("correct password");
//         req.session.authenticated = true;
//         req.session.email = email;
//         req.session.name = result[0].name;
//         req.session.userId = result[0]._id.toString(); // FIX 2: set userId on login
//         res.redirect('/quiz');
//         return;
//     } else {
//         console.log("incorrect password");
//         res.render("login", { error: "Invalid email/password combination" }); // FIX 3: removed "/" prefix
//     }
// });

module.exports = router;