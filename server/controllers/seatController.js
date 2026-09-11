// backend/controllers/seatController.js
const mongoose = require('mongoose');

// Import Mongoose Models
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Screen = require('../models/Screen'); // Needed to get total_seats if desired

/**
 * Fetches the layout for a specific screen, indicating which seats are booked for a given showtime.
 */
exports.getSeatLayout = async (req, res, next) => {
    const { screenId, showtimeId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(screenId)) {
        return res.status(400).json({ message: "Invalid Screen ID format." });
    }
    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
        return res.status(400).json({ message: "Invalid Showtime ID format." });
    }

    try {
        // Get all seats for the screen
        const seats = await Seat.find({ screen_id: screenId }).lean();
        
        // Get booked seats for this showtime
        // Treat both 'paid' and 'pending' bookings as holding seats
        const bookings = await Booking.find({ 
            showtime_id: showtimeId,
            payment_status: { $in: ['paid', 'pending'] }
        }).select('booked_seats.seat_id').lean();

        // Extract all booked seat IDs from the bookings
        const bookedSeatIds = new Set();
        bookings.forEach(booking => {
            booking.booked_seats.forEach(bookedSeat => {
                bookedSeatIds.add(bookedSeat.seat_id.toString());
            });
        });

        // Mark seats as available/booked
        const seatLayout = seats.map(seat => ({
            ...seat,
            is_available: !bookedSeatIds.has(seat._id.toString())
        }));

        res.json(seatLayout);
    } catch (error) {
        console.error('Error fetching seat layout:', error);
        next(error);
    }
};

/**
 * Fetches all seats for a specific screen.
 */
exports.getScreenSeats = async (req, res, next) => {
    const { screenId } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(screenId)) {
        return res.status(400).json({ message: "Invalid Screen ID format." });
    }

    try {
        // Check if screen exists
        const screenExists = await Screen.findById(screenId).select('_id').lean();
        if (!screenExists) {
            return res.status(404).json({ message: "Screen not found." });
        }

        // Get all seats for the screen
        const seats = await Seat.find({ screen_id: screenId })
            .sort({ row: 1, number_in_row: 1 }) // Sort by row and then by number within row
            .lean();

        res.json(seats);
    } catch (error) {
        console.error('Error fetching screen seats:', error);
        next(error);
    }
};

/**
 * Updates seats for a specific screen.
 */
exports.updateScreenSeats = async (req, res, next) => {
    const { screenId } = req.params;
    const { seats } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(screenId)) {
        return res.status(400).json({ message: "Invalid Screen ID format." });
    }

    // Validate seats array
    if (!Array.isArray(seats)) {
        return res.status(400).json({ message: "Seats must be provided as an array." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check if screen exists
        const screen = await Screen.findById(screenId).session(session);
        if (!screen) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Screen not found." });
        }

        // Delete existing seats
        await Seat.deleteMany({ screen_id: screenId }).session(session);

        // Validate and prepare new seats
        const seatsToCreate = [];
        const allSeatIdentifiers = new Set();

        for (const seat of seats) {
            const rowName = seat.row.trim().toUpperCase();
            const seatNum = parseFloat(seat.number_in_row);

            if (isNaN(seatNum)) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ 
                    message: `Invalid seat number in row '${rowName}'. Number must be numeric.` 
                });
            }

            if (seatNum < 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ 
                    message: `Invalid seat number in row '${rowName}'. Number must be positive.` 
                });
            }

            const seatIdentifier = `${rowName}${seatNum.toFixed(1)}`;
            if (allSeatIdentifiers.has(seatIdentifier)) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ 
                    message: `Duplicate seat number '${seatIdentifier}' detected.` 
                });
            }
            allSeatIdentifiers.add(seatIdentifier);

            seatsToCreate.push({
                screen_id: screenId,
                seat_number: seatIdentifier,
                row: rowName,
                number_in_row: seatNum,
                seat_type: seat.seat_type.trim(),
                price: seat.price
            });
        }

        // Create new seats
        await Seat.insertMany(seatsToCreate, { session });

        // Update screen's total_seats
        screen.total_seats = seatsToCreate.length;
        await screen.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Seats updated successfully', seats: seatsToCreate });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error updating screen seats:', error);
        if (error.code === 11000) {
            return res.status(409).json({ 
                message: 'Error updating seats, possible duplicate seat numbers.' 
            });
        }
        next(error);
    } finally {
        session.endSession();
    }
};

// module.exports = { getSeatLayout, getScreenSeats }; // Already exporting using exports.getSeatLayout and exports.getScreenSeats