// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const User = require('../models/User'); // Import User model to fetch user details if needed
const Theater = require('../models/Theater'); // Import Theater model for ownership checks

/**
 * Middleware: Authenticate JWT Token
 * Verifies the JWT token from the Authorization header.
 * Attaches the decoded user payload (userId, role) to req.user if valid.
 */
exports.authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify the user still exists in the database
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User no longer exists' });
        }

        // Initialize req.user with basic user info
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            email: decoded.email,
            name: decoded.name
        };

        // Only fetch and attach theater_id for theater_admin role
        if (user.role === 'theater_admin') {
            const theater = await Theater.findOne({ user_id: user._id });
            if (!theater) {
                return res.status(500).json({ 
                    message: 'Theater admin account is not properly configured. Please contact support.' 
                });
            }
            req.user.theater_id = theater._id;
        }

        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.name, error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }

        return res.status(500).json({ message: 'Internal server error during authentication' });
    }
};

/**
 * Middleware: Authorize Theatre Admin Role
 * Checks if the authenticated user has the 'theatre_admin' role.
 * Optionally checks if the theatre_admin owns the theater specified by req.params.theaterId.
 */
exports.authorizeTheatreAdmin = async (req, res, next) => {
    // console.log("authorizeTheatreAdmin middleware called"); // Optional: Keep for debugging

    // Ensure user is authenticated first (authenticateJWT should run before this)
    if (!req.user || !req.user.role) {
        // console.log("No req.user object or role - Authentication likely failed earlier."); // Optional
        return res.status(401).json({ message: 'Unauthorized: Authentication required.' });
    }

    //console.log(`[Auth Debug] Checking role: req.user.role is "${req.user.role}" (Type: ${typeof req.user.role})`);

    // Check for the 'theatre_admin' role
    if (req.user.role !== 'theater_admin') {
        // console.log(`Forbidden: User role '${req.user.role}' is not 'theatre_admin'.`); // Optional
        return res.status(403).json({ message: 'Forbidden: Theatre Admin role required.' });
    }

    // Check Theater Ownership if theaterId is present in route params
    const theaterId = req.params.theaterId;
    if (theaterId) {
        // Validate the theaterId format first
        if (!mongoose.Types.ObjectId.isValid(theaterId)) {
            return res.status(400).json({ message: 'Invalid Theater ID format in URL.' });
        }
        // Validate userId from token
        if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
             return res.status(401).json({ message: 'Invalid user ID in token.' });
        }

        // console.log(`Checking ownership: theaterId=${theaterId}, userId=${req.user.userId}`); // Optional
        try {
            // Check if a theater exists with this ID and is owned by this user_id
            const theater = await Theater.findOne({
                _id: theaterId,
                user_id: req.user.userId // Check against user_id field in Theater model
            }).select('_id') // Only need to check existence
              .lean(); // Use lean for performance

            if (!theater) {
                // console.log(`Forbidden: Theatre Admin ${req.user.userId} not associated with theater ${theaterId}`); // Optional
                return res.status(403).json({ message: 'Forbidden: Not authorized for this specific theater.' });
            }

            // console.log(`Authorization successful: Theatre Admin ${req.user.userId} owns theater ${theaterId}`); // Optional
            next(); // User is theatre_admin AND owns this theater

        } catch (error) {
            console.error("Database error during theater ownership check:", error);
            return res.status(500).json({ message: 'Internal server error during authorization check.' });
        }
    } else {
        // No theaterId in params, just checking the role was sufficient
        // console.log("No theaterId in params, proceeding based on Theatre Admin role only."); // Optional
        next();
    }
};

/**
 * Middleware: Authorize Admin Role
 * Checks if the authenticated user has the 'admin' role.
 */
exports.authorizeAdmin = (req, res, next) => {
    // console.log("authorizeAdmin middleware called"); // Optional: Keep for debugging

    // Ensure user is authenticated first
    if (!req.user || !req.user.role) {
        // console.log("No req.user object or role - Authentication likely failed earlier (Admin)."); // Optional
        return res.status(401).json({ message: 'Unauthorized: Authentication required.' });
    }

    // Check for 'admin' role
    if (req.user.role !== 'admin') {
        // console.log(`Forbidden: User role '${req.user.role}' is not 'admin'.`); // Optional
        return res.status(403).json({ message: 'Forbidden: Admin role required.' });
    }

    // console.log("Authorized: General Admin role confirmed."); // Optional
    next(); // User is an admin, proceed
};

/**
 * Middleware: General Authorization by Roles
 * Checks if the authenticated user's role is included in the allowedRoles array.
 * Example Usage: authorizeRoles('admin', 'theatre_admin')
 */
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated first
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Unauthorized: Authentication required.' });
        }

        // Check if the user's role is in the list of allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden: Role '${req.user.role}' is not authorized for this resource.`
            });
        }

        next(); // Role is allowed, proceed
    };
};