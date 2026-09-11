// backend/controllers/theaterController.js
const mongoose = require('mongoose');

// Import Mongoose Models
const Theater = require('../models/Theater');
const Screen = require('../models/Screen');
const Seat = require('../models/Seat');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User'); // Needed for theatre_admin checks

// --- Get All Theaters (with role-based filtering) ---
exports.getAllTheaters = async (req, res, next) => {
    try {
        let query = {}; // Empty query object means find all

        // If the user is a theatre_admin, filter by their user_id
        if (req.user && req.user.role === 'theater_admin') {
            // Ensure user ID is valid (should be guaranteed by auth middleware)
            if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
                return res.status(401).json({ message: 'Invalid user ID in token.' });
            }
            query = { user_id: req.user.userId };
        }
        // Note: You might want to add a check for 'admin' role to allow them to see all

        const theaters = await Theater.find(query).lean(); // Use lean for performance
        res.json(theaters);
    } catch (error) {
        console.error('Error fetching theaters:', error);
        next(error); // Pass to error handler
    }
};

// --- Get Screens by Theater ID ---
exports.getScreensByTheater = async (req, res, next) => {
    const { theaterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
        return res.status(400).json({ message: 'Invalid Theater ID format.' });
    }

    try {
        // Check if theater exists (optional but good practice)
        const theaterExists = await Theater.findById(theaterId).select('_id').lean();
        if (!theaterExists) {
            return res.status(404).json({ message: 'Theater not found.' });
        }

        const screens = await Screen.find({ theater_id: theaterId }).lean();
        res.json(screens);
    } catch (error) {
        console.error('Error fetching screens:', error);
        next(error);
    }
};

// --- Get Theaters by City ---
exports.getTheatersByCity = async (req, res, next) => {
    const { city } = req.params;

    if (!city || typeof city !== 'string' || city.trim() === '') {
        return res.status(400).json({ message: 'City parameter is required.' });
    }

    try {
        // Use case-insensitive search for city if desired
        const cityRegex = new RegExp(`^${city.trim()}$`, 'i'); // Exact match, case-insensitive
        const theaters = await Theater.find({ city: cityRegex }).lean();
        res.json(theaters);
    } catch (error) {
        console.error('Error fetching theaters by city:', error);
        next(error);
    }
};

// --- Get Theater by ID ---
exports.getTheaterById = async (req, res, next) => {
    const { theaterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
        return res.status(400).json({ message: 'Invalid Theater ID format.' });
    }

    try {
        const theater = await Theater.findById(theaterId).lean();
        if (!theater) {
            return res.status(404).json({ message: 'Theater not found' });
        }
        res.json(theater);
    } catch (error) {
        console.error('Error fetching theater by ID:', error);
        next(error);
    }
};

// --- Get Theater Details (Identical to getTheaterById, potentially redundant) ---
// You can keep this if your frontend specifically calls /details, otherwise getTheaterById suffices.
exports.getTheaterDetails = async (req, res, next) => {
    const { theaterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
        return res.status(400).json({ message: 'Invalid Theater ID format.' });
    }

    try {
        const theater = await Theater.findById(theaterId).lean();
        if (!theater) {
            return res.status(404).json({ message: 'Theater not found' });
        }
        res.json(theater);
    } catch (error) {
        console.error('Error fetching theater details:', error);
        next(error);
    }
};

// --- Get Showtimes by Theater (This logic is already in showtimeController, likely redundant here) ---
// Recommend removing this function from theaterController and using the one in showtimeController.
// If kept, it needs significant changes to use Mongoose models like in showtimeController.
/*
exports.getShowtimesByTheater = async (req, res, next) => {
    // ... (Implementation using Mongoose models - see showtimeController for example)
    // This function is likely better placed and already implemented in showtimeController.js
    console.warn("Redundant getShowtimesByTheater called in theaterController.");
    // Forward to showtimeController's implementation or return error
    return res.status(501).json({ message: "Not Implemented in theaterController. Use showtime controller."});
};
*/

// --- Create Screen and Seats ---
exports.createScreen = async (req, res, next) => {
    const { theaterId } = req.params;
    // Expecting: screen_number (string), seatRows (array of objects)
    // seatRows object: { row_name: string, seat_numbers: string (comma-separated), seat_type: string, price: number }
    const { screen_number, seatRows, format } = req.body;

    console.log("createScreen: Received theaterId:", theaterId, "screen_number:", screen_number, "format:", format);
    // console.log("createScreen: Received seatRows:", JSON.stringify(seatRows, null, 2)); // Verbose logging

    // --- Validation ---
    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
        return res.status(400).json({ message: 'Invalid Theater ID format.' });
    }
    if (!screen_number || typeof screen_number !== 'string' || screen_number.trim() === '') {
        return res.status(400).json({ message: 'Screen number is required.' });
    }
    if (!format || typeof format !== 'string' || format.trim() === '') {
        return res.status(400).json({ message: 'Screen format description is required.' });
    }
    if (!seatRows || !Array.isArray(seatRows) || seatRows.length === 0) {
        return res.status(400).json({ message: 'seatRows must be a non-empty array.' });
    }
    // Validate structure of each item in seatRows
    for (const rowConfig of seatRows) {
        if (typeof rowConfig !== 'object' || !rowConfig.row_name || typeof rowConfig.row_name !== 'string' || rowConfig.row_name.trim() === '' ||
            !rowConfig.seat_numbers || typeof rowConfig.seat_numbers !== 'string' || rowConfig.seat_numbers.trim() === '' ||
            !rowConfig.seat_type || typeof rowConfig.seat_type !== 'string' || rowConfig.seat_type.trim() === '' ||
            rowConfig.price === undefined || typeof rowConfig.price !== 'number' || rowConfig.price < 0) {
            console.error("Invalid rowConfig:", rowConfig); // Log invalid structure
            return res.status(400).json({ message: 'Each item in seatRows must be an object with valid properties: row_name(string), seat_numbers(string), seat_type(string), price(number >= 0).' });
        }
        // Optional: Validate seat_numbers format further (e.g., contains only numbers/commas)
    }

    // --- Use Transaction for Atomicity ---
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check if Theater exists
        const theaterExists = await Theater.findById(theaterId).select('_id').session(session).lean();
        if (!theaterExists) {
             await session.abortTransaction(); session.endSession();
             return res.status(404).json({ message: 'Theater not found.' });
        }

        // Check for duplicate screen number within the same theater
        const existingScreen = await Screen.findOne({ theater_id: theaterId, screen_number: screen_number.trim() }).session(session).lean();
         if (existingScreen) {
             await session.abortTransaction(); session.endSession();
             return res.status(409).json({ message: `Screen number '${screen_number}' already exists in this theater.`}); // Conflict
         }

        // Calculate total seats and prepare seat documents
        let total_seats = 0;
        const seatsToCreate = [];
        const allSeatNumbersInScreen = new Set(); // To check for duplicates within the request

        for (const rowConfig of seatRows) {
            const rowName = rowConfig.row_name.trim().toUpperCase();
            const seatNumbersArray = rowConfig.seat_numbers.split(',')
                .map(s => s.trim())
                .filter(s => s !== "")
                .map(numStr => parseInt(numStr, 10)); // Convert to numbers for sorting/logic

            if (seatNumbersArray.some(isNaN)) {
                 await session.abortTransaction(); session.endSession();
                 return res.status(400).json({ message: `Invalid seat numbers found in row '${rowName}'. Numbers must be integers.` });
            }

            // Sort seat numbers numerically within the row
            seatNumbersArray.sort((a, b) => a - b);

            total_seats += seatNumbersArray.length;

            for (const seatNum of seatNumbersArray) {
                const seatIdentifier = `${rowName}${seatNum}`; // e.g., A1, B12

                // Check for duplicate seat identifiers within this request
                if (allSeatNumbersInScreen.has(seatIdentifier)) {
                     await session.abortTransaction(); session.endSession();
                     return res.status(400).json({ message: `Duplicate seat number '${seatIdentifier}' detected in the request.` });
                }
                allSeatNumbersInScreen.add(seatIdentifier);

                seatsToCreate.push({
                    // screen_id will be added after screen creation
                    seat_number: seatIdentifier,
                    row: rowName,
                    number_in_row: seatNum,
                    seat_type: rowConfig.seat_type.trim(),
                    price: rowConfig.price,
                });
            }
        }

        console.log("createScreen: Calculated total_seats:", total_seats);

        // Create the Screen document
        const screenArr = await Screen.create([{
            theater_id: theaterId,
            screen_number: screen_number.trim(),
            format: format.trim(),
            total_seats: total_seats
        }], { session });
        const newScreen = screenArr[0];
        console.log("createScreen: Screen created, screen_id:", newScreen._id);

        // Add screen_id to each seat document
        const seatsWithScreenId = seatsToCreate.map(seat => ({
            ...seat,
            screen_id: newScreen._id
        }));

        // Bulk insert seats
        await Seat.insertMany(seatsWithScreenId, { session });
        console.log(`createScreen: ${seatsWithScreenId.length} seats created successfully.`);

        // Commit the transaction
        await session.commitTransaction();

        res.status(201).json({ message: 'Screen and seats created successfully', screen: newScreen });

    } catch (error) {
        await session.abortTransaction(); // Rollback on error
        console.error('Error creating screen and seats:', error);
         if (error.code === 11000 || error.name === 'BulkWriteError') { // Handle potential duplicate seat errors from insertMany
             return res.status(409).json({ message: 'Error creating seats, possible duplicate seat number for this screen.', details: error.message });
        }
        next(error); // Pass other errors
    } finally {
        session.endSession(); // End session
    }
};

// --- Update Screen and Seats ---
exports.updateScreen = async (req, res, next) => {
    const { theaterId, screenId } = req.params;
    const { screen_number, format } = req.body;

    if (!mongoose.Types.ObjectId.isValid(screenId) || !mongoose.Types.ObjectId.isValid(theaterId)) {
        return res.status(400).json({ message: 'Invalid ID format.' });
    }

    if (!screen_number || typeof screen_number !== 'string' || screen_number.trim() === '') {
        return res.status(400).json({ message: 'Screen number is required.' });
    }

    if (!format || typeof format !== 'string' || format.trim() === '') {
        return res.status(400).json({ message: 'Screen format is required.' });
    }

    try {
        // Check if theater exists
        const theater = await Theater.findById(theaterId).select('_id').lean();
        if (!theater) {
            return res.status(404).json({ message: 'Theater not found.' });
        }

        // Check if screen exists and belongs to the theater
        const screen = await Screen.findOne({ _id: screenId, theater_id: theaterId });
        if (!screen) {
            return res.status(404).json({ message: 'Screen not found or does not belong to this theater.' });
        }

        // Check for duplicate screen number within the same theater (excluding current screen)
        const existingScreen = await Screen.findOne({
            theater_id: theaterId,
            screen_number: screen_number.trim(),
            _id: { $ne: screenId }
        }).lean();

        if (existingScreen) {
            return res.status(409).json({ message: `Screen number '${screen_number}' already exists in this theater.` });
        }

        // Update the screen
        const updatedScreen = await Screen.findByIdAndUpdate(
            screenId,
            {
                screen_number: screen_number.trim(),
                format: format.trim()
            },
            { new: true }
        );

        res.json({ message: 'Screen updated successfully', screen: updatedScreen });

    } catch (error) {
        console.error('Error updating screen:', error);
        next(error);
    }
};

// --- Delete Screen and Associated Data ---
exports.deleteScreen = async (req, res, next) => {
    const { screenId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(screenId)) {
        return res.status(400).json({ message: 'Invalid Screen ID format.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log(`Attempting to delete screen ${screenId} and related data.`);

        // 1. Find showtimes associated with the screen
        const showtimesToDelete = await Showtime.find({ screen_id: screenId }).select('_id').session(session).lean();
        const showtimeIds = showtimesToDelete.map(st => st._id);
        console.log(`Found ${showtimeIds.length} showtimes for screen ${screenId}.`);

        if (showtimeIds.length > 0) {
            // 2. Find bookings associated with these showtimes
            const bookingsToDelete = await Booking.find({ showtime_id: { $in: showtimeIds } }).select('_id').session(session).lean();
            const bookingIds = bookingsToDelete.map(b => b._id);
            console.log(`Found ${bookingIds.length} bookings for these showtimes.`);

            if (bookingIds.length > 0) {
                // 3. Delete Payments associated with these bookings
                const paymentDeleteResult = await Payment.deleteMany({ booking_id: { $in: bookingIds } }).session(session);
                console.log(`Deleted ${paymentDeleteResult.deletedCount} payments.`);

                // 4. Delete Bookings
                const bookingDeleteResult = await Booking.deleteMany({ _id: { $in: bookingIds } }).session(session);
                console.log(`Deleted ${bookingDeleteResult.deletedCount} bookings.`);
            }

            // 5. Delete Showtimes
            const showtimeDeleteResult = await Showtime.deleteMany({ _id: { $in: showtimeIds } }).session(session);
            console.log(`Deleted ${showtimeDeleteResult.deletedCount} showtimes.`);
        }

        // 6. Delete Seats associated with the screen
        const seatDeleteResult = await Seat.deleteMany({ screen_id: screenId }).session(session);
        console.log(`Deleted ${seatDeleteResult.deletedCount} seats for screen ${screenId}.`);

        // 7. Delete the Screen itself
        const deletedScreen = await Screen.findByIdAndDelete(screenId).session(session);

        if (!deletedScreen) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ message: 'Screen not found.' });
        }
        console.log(`Deleted screen ${screenId}.`);

        // Commit transaction
        await session.commitTransaction();

        res.json({ message: 'Screen and all associated data deleted successfully', screenId: screenId });

    } catch (error) {
        await session.abortTransaction();
        console.error(`Error deleting screen ${screenId}:`, error);
        next(error);
    } finally {
        session.endSession();
    }
};

// --- Create Theater ---
exports.createTheater = async (req, res, next) => {
    const { name, location, city } = req.body;
    const userId = req.user?.userId; // Optional: Associate with logged-in user (e.g., theatre_admin)
    const userRole = req.user?.role;

    // Validation
    if (!name || !location || !city) {
        return res.status(400).json({ message: 'Name, location, and city are required.' });
    }

    const theaterData = { name, location, city };

    // Assign user_id only if the user is a theatre_admin creating their own theatre
    if (userId && userRole === 'theater_admin') {
        theaterData.user_id = userId;
    }
    // Admins might create theaters without associating them immediately, handle as needed

    try {
        // Optional: Check for duplicate theater name/city
        const existingTheater = await Theater.findOne({ name: name, city: city }).lean();
        if (existingTheater) {
            return res.status(409).json({ message: `Theater named '${name}' already exists in ${city}.` });
        }

        const newTheater = await Theater.create(theaterData);
        res.status(201).json({ message: 'Theater created successfully', theater: newTheater });

    } catch (error) {
        console.error('Error creating theater:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        next(error);
    }
};

// --- Update Theater ---
exports.updateTheater = async (req, res, next) => {
    const { theaterId } = req.params;
    const { name, location, city, user_id } = req.body; // Include user_id if admin needs to assign/change owner

    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
        return res.status(400).json({ message: 'Invalid Theater ID format.' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (city !== undefined) updateData.city = city;
    // Only allow admin to change user_id association?
    if (user_id !== undefined && req.user?.role === 'admin') {
         if (user_id === null || mongoose.Types.ObjectId.isValid(user_id)) {
             updateData.user_id = user_id; // Allow setting to null or valid ID
         } else {
             return res.status(400).json({ message: 'Invalid User ID format for assignment.' });
         }
    }


    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        // Optional: Check ownership if theatre_admin is updating
         if (req.user?.role === 'theater_admin') {
             const theater = await Theater.findOne({ _id: theaterId, user_id: req.user.userId });
             if (!theater) {
                 return res.status(403).json({ message: 'Forbidden: You can only update your own theater.' });
             }
             // Prevent theatre_admin from changing the owner
             if (updateData.user_id !== undefined && updateData.user_id !== req.user.userId) {
                delete updateData.user_id; // Or return an error
                 console.warn(`Theatre admin ${req.user.userId} attempted to change owner of theater ${theaterId}. Denied.`);
             }
         }

        const updatedTheater = await Theater.findByIdAndUpdate(
            theaterId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedTheater) {
            return res.status(404).json({ message: 'Theater not found.' });
        }

        res.json({ message: 'Theater updated successfully', theater: updatedTheater });

    } catch (error) {
        console.error('Error updating theater:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
         if (error.code === 11000) { // Handle duplicate name/city if index exists
             return res.status(409).json({ message: 'Update failed due to duplicate name/city constraint.' });
        }
        next(error);
    }
};

// --- Delete Theater ---
// WARNING: This is highly destructive. Ensure proper authorization and cascading deletes.
exports.deleteTheater = async (req, res, next) => {
    const { theaterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(theaterId)) {
        return res.status(400).json({ message: 'Invalid Theater ID format.' });
    }

    // Authorization: Ensure only admin or the correct theatre_admin can delete
     if (req.user?.role === 'theater_admin') {
        const theater = await Theater.findOne({ _id: theaterId, user_id: req.user.userId });
         if (!theater) {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own theater.' });
        }
    } else if (req.user?.role !== 'admin') {
         return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }


    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log(`Attempting to delete theater ${theaterId} and ALL related data.`);

        // 1. Find Screens associated with the theater
        const screensToDelete = await Screen.find({ theater_id: theaterId }).select('_id').session(session).lean();
        const screenIds = screensToDelete.map(s => s._id);
        console.log(`Found ${screenIds.length} screens for theater ${theaterId}.`);

        if (screenIds.length > 0) {
            // Use the screen deletion logic (which handles showtimes, bookings, payments, seats)
            for (const screenId of screenIds) {
                 console.log(`Deleting screen ${screenId} as part of theater deletion.`);
                 // --- Replicate screen deletion logic within the transaction ---
                 const showtimesToDelete = await Showtime.find({ screen_id: screenId }).select('_id').session(session).lean();
                 const showtimeIds = showtimesToDelete.map(st => st._id);
                 if (showtimeIds.length > 0) {
                     const bookingsToDelete = await Booking.find({ showtime_id: { $in: showtimeIds } }).select('_id').session(session).lean();
                     const bookingIds = bookingsToDelete.map(b => b._id);
                     if (bookingIds.length > 0) {
                         await Payment.deleteMany({ booking_id: { $in: bookingIds } }).session(session);
                         await Booking.deleteMany({ _id: { $in: bookingIds } }).session(session);
                     }
                     await Showtime.deleteMany({ _id: { $in: showtimeIds } }).session(session);
                 }
                 await Seat.deleteMany({ screen_id: screenId }).session(session);
                 await Screen.findByIdAndDelete(screenId).session(session); // Delete the screen itself
                 console.log(`Finished deleting data for screen ${screenId}.`);
            }
        }

        // 2. Delete the Theater itself
        const deletedTheater = await Theater.findByIdAndDelete(theaterId).session(session);

        if (!deletedTheater) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ message: 'Theater not found (already deleted?).' });
        }
        console.log(`Deleted theater ${theaterId}.`);

        // Commit transaction
        await session.commitTransaction();

        res.json({ message: 'Theater and all associated data deleted successfully', theaterId: theaterId });

    } catch (error) {
        await session.abortTransaction();
        console.error(`Error deleting theater ${theaterId}:`, error);
        next(error);
    } finally {
        session.endSession();
    }
};

// --- Search Theaters ---
exports.searchTheaters = async (req, res, next) => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Search query is required.' });
    }

    try {
        // Create a case-insensitive regex for the search query
        const searchRegex = new RegExp(query.trim(), 'i');

        // Search in theater name and location
        const theaters = await Theater.find({
            $or: [
                { name: searchRegex },
                { location: searchRegex },
                { city: searchRegex }
            ]
        }).lean();

        res.json(theaters);
    } catch (error) {
        console.error('Error searching theaters:', error);
        next(error);
    }
};

// --- Get Distinct Cities ---
exports.getCities = async (req, res, next) => {
    try {
        // Use distinct() method on the Theater collection
        const cities = await Theater.distinct('city');
        // Filter out any null or empty string cities if necessary
        const validCities = cities.filter(city => city && typeof city === 'string' && city.trim() !== '');
        res.json(validCities);
    } catch (error) {
        console.error('Error fetching cities:', error);
        next(error);
    }
};