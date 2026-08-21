const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
    return jwt.sign({ id },
        process.env.JWT_SECRET, {
        expiresIn: "7d",
    }
    );
};

// REGISTER
exports.register = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        email = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email,
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hash = await bcrypt.hash(
            password,
            10
        );

        const user = await User.create({
            name,
            email,
            password: hash,
            role: "user",
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (err) {
        console.error("Register Error:", err);

        res.status(500).json({
            message: err.message,
        });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        email = email.trim().toLowerCase();

        const user = await User.findOne({
            email,
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const match = await bcrypt.compare(
            password,
            user.password
        );

        if (!match) {
            return res.status(400).json({
                message: "Invalid password",
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || "user",
            token: generateToken(user._id),
        });
    } catch (err) {
        console.error("Login Error:", err);

        res.status(500).json({
            message: err.message,
        });
    }
};

// GOOGLE AUTH
exports.googleAuth = async (req, res) => {
    try {
        let { name, email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required for Google login",
            });
        }

        email = email.trim().toLowerCase();

        let user = await User.findOne({
            email,
        });

        if (!user) {
            const randomPassword =
                Math.random()
                    .toString(36)
                    .slice(-10) + "Aa1!";

            const hash = await bcrypt.hash(
                randomPassword,
                10
            );

            user = await User.create({
                name: name ||
                    email.split("@")[0],
                email,
                password: hash,
                role: "user",
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || "user",
            token: generateToken(user._id),
        });
    } catch (err) {
        console.error(
            "Google Auth Error:",
            err
        );

        res.status(500).json({
            message: err.message ||
                "Google auth failed",
        });
    }
};