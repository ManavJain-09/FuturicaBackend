// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JWT
const { v4: uuidv4 } = require('uuid'); // For unique user IDs
const User = require('../model/user');
require('dotenv').config(); // Load environment variables

// @route   POST api/users/register
// @desc    Register a user
// @access  Public
// routes/userRoutes.js
const register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check for missing required fields
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Please enter all required fields' });
        }

        // Check if the email already exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user with a unique userId
        let user = new User({
            userId: uuidv4(),
            name,
            email,
            password: hashedPassword,
            loggedIn: false,// Set default login state
            selfDeclaration: false
        });

        await user.save();

        res.status(201).json({ msg: 'User registered successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


// @route   POST api/users/login
// @desc    Login a user
// @access  Public
// routes/userRoutes.js
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if today is Sunday
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.

        if (dayOfWeek === 0) {
            return res.status(403).json({ message: 'Login is not allowed on Sundays.' });
        }
        // Check for missing required fields
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all required fields' });
        }

        // Check if the user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Cannot find email' });
        }

        // Check if the user is already logged in
        if (user.loggedIn) {
            return res.status(400).json({ msg: 'User already logged in on another device' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Wrong Password' });
        }

        // Create and assign a token
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token expiration time
            async (err, token) => {
                if (err) throw err;

                // Set the user as logged in
                user.loggedIn = true;
                await user.save();

                res.status(200).json({ msg: "User Logged In Successfully", token, user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
// routes/userRoutes.js
const logout = async (req, res) => {
    const { userId } = req.body;

    try {
        // Check if the user exists
        let user = await User.findOne({ userId });
        if (!user) {
            return res.status(400).json({ msg: 'Cannot find email' });
        }

        // Check if the user is logged in
        if (!user.loggedIn) {
            return res.status(400).json({ msg: 'User is not logged in' });
        }

        // Set the user as logged out
        user.loggedIn = false;
        await user.save();

        res.status(200).json({ msg: "User Logged Out Successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// GET all users
const users = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// POST /api/searchUser
const searchUser = async (req, res) => {
    try {
        const { userId, email } = req.body;

        // Build the search query based on available fields
        let searchQuery = {};
        if (userId) searchQuery.userId = userId;
        if (email) searchQuery.email = email;

        if (Object.keys(searchQuery).length === 0) {
            return res.status(400).json({ message: 'Please provide userId or email to search.' });
        }

        // Find the user based on the search query
        const user = await User.findOne(searchQuery);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Respond with the user details
        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error.' });
    }
};


router.post("/logout", logout);
router.post("/register", register);
router.post("/login", login);
router.get("/users", users);
router.post("/searchUser", searchUser);

module.exports = router;
