// backend/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const mongoose = require('mongoose');
const crypto = require('crypto'); // For generating OTP

// Import Mongoose Models
const User = require('../models/User');
const Theater = require('../models/Theater');
const Otp = require('../models/Otp'); // <<< Import OTP model

// Import Email Service
const sendEmail = require('../utils/emailService'); // <<< Import Email Service

// --- Helper Function for JWT Generation ---
const generateToken = (user) => {
    console.log("--- [generateToken Debug] ---");
    console.log("User object passed:", JSON.stringify(user, null, 2)); // Log the entire user object passed

    const tokenPayload = {
        userId: user._id,
        role: user.role,
        email: user.email,
        name: user.name
    };

    // Ensure theater_id is available *on the user object* passed to generateToken if needed
    // This might require fetching it before calling generateToken in login/signup completion
    if (user.role === 'theater_admin' && user.theater_id) {
        tokenPayload.theater_id = user.theater_id;
        console.log("Adding theater_id to token:", user.theater_id);
    } else if (user.role === 'theater_admin') {
         console.warn(`Theater admin ${user._id} missing theater_id during token generation.`);
         // Decide if this is an error or acceptable state
    }

    const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    console.log("Generated Token Payload:", tokenPayload);
    console.log("Generated Token (first few chars):", token.substring(0, 15) + "...");
    console.log("--- [End generateToken Debug] ---");
    return token;
};


// --- Send Signup OTP Function ---
exports.sendSignupOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Validate Email
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }
        const lowerCaseEmail = email.toLowerCase().trim();

        // 2. Check if User Already Exists with this email
        const existingUser = await User.findOne({ email: lowerCaseEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // 3. Generate 4-Digit OTP
        const otp = crypto.randomInt(1000, 10000).toString(); // 1000 to 9999

        // 4. Hash the OTP for storage security
        const hashedOtp = await bcrypt.hash(otp, 10); // Use moderate salt rounds

        // 5. Store Hashed OTP & Email (Replace existing OTP for this email)
        // Upsert: find one and update, or insert if not found.
        // Simpler approach: Delete any existing then create new.
        await Otp.deleteOne({ email: lowerCaseEmail }); // Ensure only one active OTP per email
        const otpEntry = await Otp.create({
            email: lowerCaseEmail,
            otp: hashedOtp,
            // createdAt will default to now, expires based on TTL index
        });
         console.log(`OTP entry created for ${lowerCaseEmail}, expires in 5 minutes.`);

        // 6. Send OTP Email via Nodemailer service
        const emailSubject = 'Your Cineplus Signup OTP';
        const emailHtml = `
            <div style="font-family: Helvetica, Arial, sans-serif; padding: 25px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto; background-color: #f9f9f9;">
                <h2 style="color: #333; text-align: center;">Welcome to Cineplus!</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">Thank you for signing up. Please use the following One-Time Password (OTP) to verify your email address. This OTP is valid for <strong>5 minutes</strong>.</p>
                <p style="font-size: 32px; font-weight: bold; color: #75d402; letter-spacing: 3px; text-align: center; background-color: #e9f5dc; padding: 15px; border-radius: 5px; margin: 25px 0;">${otp}</p>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">If you did not request this OTP, please ignore this email or contact support if you suspect misuse.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                <p style="font-size: 14px; color: #888; text-align: center;">Best regards,<br/>The Cineplus Team</p>
            </div>
        `;
        const emailText = `Welcome to Cineplus!\n\nYour One-Time Password (OTP) is: ${otp}\nThis OTP is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Cineplus Team`;

        try {
            await sendEmail({
                email: lowerCaseEmail, // Send to the user's provided email
                subject: emailSubject,
                html: emailHtml,
                message: emailText,
            });
             console.log(`Signup OTP email sent successfully to ${lowerCaseEmail}`);
             // Send success response to frontend
             res.status(200).json({ message: 'OTP sent successfully to your email.' });
        } catch (emailError) {
             console.error(`Failed to send OTP email to ${lowerCaseEmail}:`, emailError);
             // Important: Inform the frontend that email sending failed.
             // The OTP is still stored, but the user won't receive it.
             // Consider deleting the OTP entry here if email fails?
             // await Otp.deleteOne({ _id: otpEntry._id }); // Optionally cleanup DB if email fails
             return res.status(500).json({ message: 'Failed to send OTP email. Please ensure the email address is correct and try again later.' });
        }

    } catch (error) {
        console.error('Send OTP Controller Error:', error);
        res.status(500).json({ message: 'Internal Server Error while sending OTP.' });
    }
};


// --- Complete Signup Function (Verify OTP and Create User) ---
exports.completeSignup = async (req, res) => {
    try {
        const { name, email, password, phone_number, otp } = req.body;

        // 1. Input Validation
        if (!name || !email || !password || !phone_number || !otp) {
            return res.status(400).json({ message: 'All fields (Name, Email, Password, Phone, OTP) are required' });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (password.length < 6) {
             return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }
        // Basic phone validation (adjust regex if needed for specific formats)
        if (!phone_number || !/^\d{10}$/.test(phone_number.trim())) {
             return res.status(400).json({ message: 'Invalid phone number format (must be 10 digits).' });
        }
        // OTP validation
        if (typeof otp !== 'string' || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
             return res.status(400).json({ message: 'Invalid OTP format. Must be 4 digits.' });
        }

        const lowerCaseEmail = email.toLowerCase().trim();

        // 2. Verify OTP
        // Find the OTP record for this email
        const otpRecord = await Otp.findOne({ email: lowerCaseEmail });

        // Check if OTP record exists (it might have expired due to TTL)
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP not found or expired. Please request a new one.' });
        }

        // Compare the provided OTP with the hashed OTP from the database
        const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);

        // If OTP is invalid, delete the record immediately to prevent reuse
        if (!isOtpValid) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // --- OTP is valid ---

        // 3. Check if User Exists (Final Check before creation)
        const existingUser = await User.findOne({ email: lowerCaseEmail });
        if (existingUser) {
            await Otp.deleteOne({ _id: otpRecord._id }); // Clean up OTP
            return res.status(400).json({ message: 'Email is already registered. Please log in.' });
        }

        // 4. Hash the User Password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 5. Create User in Database
        const newUser = await User.create({
            name: name.trim(),
            email: lowerCaseEmail,
            password: hashedPassword,
            phone_number: phone_number.trim(),
            role: 'user' // Default role for standard signup
        });

        // 6. Delete the used OTP record now that user is created
        await Otp.deleteOne({ _id: otpRecord._id });
         console.log(`OTP record deleted after successful signup for ${lowerCaseEmail}`);

        // 7. Respond with success
        // Note: Typically you don't automatically log in the user after signup + OTP.
        // They should go to the login page.
        res.status(201).json({
            message: 'Signup successful! You can now log in.',
            userId: newUser._id,
            // No token sent here usually.
        });

    } catch (error) {
        console.error('Complete Signup Controller Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        if (error.code === 11000) { // Duplicate key error (e.g., email race condition)
             return res.status(400).json({ message: 'Email already exists.' });
        }
        res.status(500).json({ message: 'Internal Server Error during signup completion.' });
    }
};


// --- Login Function (Remains the same) ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        let theater_id = null;
        let fetchedUserForToken = { ...user.toObject() }; // Clone user for token generation

        if (user.role === 'theater_admin') {
            const theater = await Theater.findOne({ user_id: user._id });
            if (theater) {
                theater_id = theater._id;
                fetchedUserForToken.theater_id = theater_id; // Add theater_id for token generation
            } else {
                return res.status(500).json({ message: 'Theater admin account not properly configured.' });
            }
        }

        // Generate Token using the potentially modified fetchedUserForToken
        const token = generateToken(fetchedUserForToken);

        // Prepare response (exclude password and add theater_id if applicable)
        const responseUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        if (user.role === 'theater_admin') {
            responseUser.theater_id = theater_id;
        }

        res.status(200).json({ message: 'Login successful', token, user: responseUser });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// --- Admin Signup Function (Remains the same) ---
exports.adminsignup = async (req, res) => {
    try {
        const { name, email, password, phone_number } = req.body;
        if (!name || !email || !password || !phone_number) return res.status(400).json({ message: 'All fields are required' });
        if (!validator.isEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
        if (!validator.isStrongPassword(password)) return res.status(400).json({ message: 'Password is not strong enough' });

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const newAdmin = await User.create({ name, email: email.toLowerCase(), password: hashedPassword, phone_number, role: 'admin' });
        res.status(201).json({ message: 'Admin user created successfully', userId: newAdmin._id });
    } catch (error) {
        console.error('Admin Signup Error:', error);
        if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join('. ') });
        if (error.code === 11000) return res.status(400).json({ message: 'Email already exists.' });
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// --- Theatre Admin Signup Function (Remains the same) ---
exports.theatreAdminSignup = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, email, password, phone_number, theater_name, theater_location, theater_city } = req.body;
        if (!name || !email || !password || !phone_number || !theater_name || !theater_location || !theater_city) {
            throw new Error('All fields are required for Theatre Admin Signup'); // Throw error to be caught
        }
        if (!validator.isEmail(email)) throw new Error('Invalid email format');
        if (!validator.isStrongPassword(password)) throw new Error('Password is not strong enough');

        const existingUser = await User.findOne({ email: email.toLowerCase() }).session(session);
        if (existingUser) throw new Error('Email already exists');

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUserArr = await User.create([{ name, email: email.toLowerCase(), password: hashedPassword, phone_number, role: 'theater_admin' }], { session });
        const theatreAdminUserId = newUserArr[0]._id;

        const newTheaterArr = await Theater.create([{ name: theater_name, location: theater_location, city: theater_city, user_id: theatreAdminUserId }], { session });
        const theaterId = newTheaterArr[0]._id;

        await session.commitTransaction();
        res.status(201).json({ message: 'Theatre Admin and Theater created successfully', userId: theatreAdminUserId, theaterId: theaterId });
    } catch (error) {
        await session.abortTransaction();
        console.error('Theatre Admin Signup Error:', error);
        if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join('. ') });
        if (error.code === 11000) return res.status(400).json({ message: 'Duplicate entry error (Email or Theater details).' });
        // Send specific error message from catch block if available
        res.status(error.message && error.message.includes('required') ? 400 : 500).json({ message: error.message || 'Internal Server Error during Theatre Admin signup' });
    } finally {
        session.endSession();
    }
};


// --- Get Me (User Profile) (Remains the same) ---
exports.getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) return res.status(401).json({ message: 'Not authorized, user ID missing' });
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let theater_id = null;
        if (user.role === 'theater_admin') {
            const theater = await Theater.findOne({ user_id: userId });
            if (theater) theater_id = theater._id;
        }
        res.status(200).json({ userId: user._id, name: user.name, email: user.email, role: user.role, phone_number: user.phone_number, profile_picture: user.profile_picture, theater_id, likedTheaters: user.likedTheaters || [], movieNotifications: user.movieNotifications || [] });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
};


// --- Update Profile Function (Remains the same) ---
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, email, phone_number, profile_picture } = req.body;
        const updateData = {};
        if (name !== undefined) { if (typeof name !== 'string' || name.trim() === '') return res.status(400).json({ message: 'Invalid name' }); updateData.name = name.trim(); }
        if (email !== undefined) { if (!validator.isEmail(email)) return res.status(400).json({ message: 'Invalid email' }); updateData.email = email.toLowerCase().trim(); }
        if (phone_number !== undefined) { if (typeof phone_number !== 'string') return res.status(400).json({ message: 'Invalid phone' }); updateData.phone_number = phone_number.trim(); }
        if (profile_picture !== undefined) { if (typeof profile_picture !== 'string') return res.status(400).json({ message: 'Invalid picture URL' }); updateData.profile_picture = profile_picture.trim(); }
        if (Object.keys(updateData).length === 0) return res.status(400).json({ message: 'No fields to update' });

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true, context: 'query' });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'Profile updated', user: { userId: updatedUser._id, name: updatedUser.name, email: updatedUser.email, phone_number: updatedUser.phone_number, role: updatedUser.role, profile_picture: updatedUser.profile_picture } });
    } catch (error) {
        console.error('Profile Update Error:', error);
        if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join('. ') });
        if (error.code === 11000) return res.status(400).json({ message: 'Email already in use.' });
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

// --- Change Password Function (Remains the same) ---
exports.changePassword = async (req, res) => {
     try {
        const userId = req.user.userId;
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmNewPassword) return res.status(400).json({ message: 'All fields required' });
        if (newPassword !== confirmNewPassword) return res.status(400).json({ message: 'Passwords do not match' });
        if (!validator.isStrongPassword(newPassword)) return res.status(400).json({ message: 'New password not strong enough' });
        if (currentPassword === newPassword) return res.status(400).json({ message: 'New password same as current' });

        const user = await User.findById(userId).select('+password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) return res.status(401).json({ message: 'Incorrect current password' });

        user.password = await bcrypt.hash(newPassword, 12); // Hash directly here
        await user.save();
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password Change Error:', error);
        if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join('. ') });
        res.status(500).json({ message: 'Failed to change password' });
    }
};