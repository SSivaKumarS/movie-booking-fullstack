// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Needed if you add password hashing methods here

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [ /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address' ], // Basic email validation
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'], // Example validation
        // Important: Select: false prevents password from being returned in queries by default
        select: false,
    },
    phone_number: {
        type: String,
        trim: true,
        // Add validation if needed (e.g., regex for phone format)
    },
    profile_picture: {
        type: String,
        default: null,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'theater_admin'],
        default: 'user',
    },
    likedTheaters: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Theater',
            default: undefined
        }
    ],
    movieNotifications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie',
            default: undefined
        }
    ],
}, {
    // Include createdAt and updatedAt timestamps
    timestamps: true,
});

// Optional: Add pre-save hook for password hashing (if not done in controller)
// userSchema.pre('save', async function(next) {
//   // Only run this function if password was actually modified
//   if (!this.isModified('password')) return next();
//
//   // Hash the password with cost of 12
//   this.password = await bcrypt.hash(this.password, 12);
//
//   next();
// });

// Optional: Add method to compare password (if not done in controller)
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };


module.exports = mongoose.model('User', userSchema);
// Mongoose will create a collection named 'users' based on this model name 'User'