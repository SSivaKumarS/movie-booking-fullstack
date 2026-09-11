// backend/controllers/bookingController.js
const mongoose = require('mongoose');

// Import Mongoose Models
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const { evaluateBestOffer } = require('../utils/offerEngine');
const Payment = require('../models/Payment'); // Keep if used elsewhere
const User = require('../models/User');       // For user email/name
const Movie = require('../models/Movie');     // For movie title
const Screen = require('../models/Screen');   // For screen number/theater ID
const Theater = require('../models/Theater'); // For theater name

// Import Email Service Utility
const sendEmail = require('../utils/emailService'); // Email service

// --- Create Booking Function ---
// (Keep the corrected createBooking function from the previous response)
exports.createBooking = async function(req, res, next) {
    const { showtimeId, seatIds } = req.body;
    const userId = req.user?.userId || req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated. Please log in.' });
    }

    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
        return res.status(400).json({ message: 'Invalid Showtime ID format.' });
    }
    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({ message: 'Seat IDs must be provided as a non-empty array.' });
    }
    if (!seatIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ message: 'One or more Seat IDs are invalid.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let savedBooking;

    try {
        console.log(`Starting booking process for user ${userId}, showtime ${showtimeId}, seats ${seatIds.join(', ')}`);

        const showtime = await Showtime.findById(showtimeId)
            .populate({ path: 'movie_id', select: 'title' })
            .populate({
                path: 'screen_id',
                select: 'screen_number theater_id',
                populate: { path: 'theater_id', select: 'name city' }
            })
            .session(session)
            .lean();

        if (!showtime) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Showtime not found.' });
        }

        const movie = showtime.movie_id;
        const screen = showtime.screen_id;
        const theater = screen?.theater_id;

        if (!movie || !screen || !theater) {
            await session.abortTransaction();
            session.endSession();
            console.error("Booking Error: Missing populated data for email", { showtimeId, hasMovie: !!movie, hasScreen: !!screen, hasTheater: !!theater });
            return res.status(500).json({ message: 'Internal error: Could not retrieve all necessary show details.' });
        }

        if (showtime.status !== 'scheduled') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: `Cannot book for a showtime that is ${showtime.status}.` });
        }
        if (new Date(showtime.start_time) < new Date()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Cannot book for a showtime that has already started.' });
        }

        const conflictingBookings = await Booking.find({
            showtime_id: showtimeId,
            'booked_seats.seat_id': { $in: seatIds },
            status: { $in: ['active', 'paid', 'accepted', 'pending'] }
        }).select('booked_seats.seat_id')
          .session(session)
          .lean();

        const currentlyBookedSeatIds = new Set();
        conflictingBookings.forEach(booking => {
            booking.booked_seats.forEach(bookedSeat => {
                 if(seatIds.includes(bookedSeat.seat_id.toString())) {
                     currentlyBookedSeatIds.add(bookedSeat.seat_id.toString());
                 }
            });
        });

        const unavailableSeatIds = seatIds.filter(requestedSeatId => currentlyBookedSeatIds.has(requestedSeatId));

        if (unavailableSeatIds.length > 0) {
            await session.abortTransaction();
            session.endSession();
            const unavailableSeatDetails = await Seat.find({ _id: { $in: unavailableSeatIds } }).select('seat_number').lean();
            const unavailableSeatNumbers = unavailableSeatDetails.map(s => s.seat_number);
            console.log(`Booking conflict: Seat(s) ${unavailableSeatNumbers.join(', ')} already booked or pending for showtime ${showtimeId}`);
            return res.status(409).json({
                message: `Seat(s) ${unavailableSeatNumbers.join(', ')} are no longer available. Please select different seats.`,
                unavailableSeats: unavailableSeatNumbers
            });
        }

        const seatsToBook = await Seat.find({
            _id: { $in: seatIds },
            screen_id: screen._id
        })
        .select('price seat_number')
        .session(session)
        .lean();

        if (seatsToBook.length !== seatIds.length) {
            await session.abortTransaction();
            session.endSession();
            console.log(`Booking failed: Seat IDs mismatch. Requested: ${seatIds.length}, Found on screen: ${seatsToBook.length}`);
            return res.status(400).json({ message: 'Invalid seat selection or mismatch. Please refresh and try again.' });
        }

        let totalAmount = 0;
        const bookedSeatDetails = seatsToBook.map(seat => {
            totalAmount += seat.price;
            return {
                seat_id: seat._id,
                seat_number: seat.seat_number,
                price: seat.price
            };
        });
        const seatNumbersString = bookedSeatDetails.map(s => s.seat_number).join(', ');

        const bookingDoc = {
            user_id: userId,
            showtime_id: showtimeId,
            booked_seats: bookedSeatDetails,
            subtotal_amount: totalAmount,
            discount_amount: 0,
            total_amount: totalAmount,
            booking_date: new Date(),
            status: 'pending',
            payment_status: 'pending'
        };

        const newBookingArr = await Booking.create([bookingDoc], { session });

        savedBooking = newBookingArr[0];
        console.log(`Booking document created: ${savedBooking._id}, Status: ${savedBooking.status}`);

        await session.commitTransaction();
        console.log(`Transaction committed successfully for booking ${savedBooking._id}`);

        res.status(201).json({
            message: 'Booking created successfully!',
            bookingId: savedBooking._id,
            totalAmount: savedBooking.total_amount,
            subtotalAmount: savedBooking.subtotal_amount,
            discountAmount: savedBooking.discount_amount,
            appliedOffer: savedBooking.applied_offer,
            bookedSeats: savedBooking.booked_seats,
        });
        // Do not send confirmation email here; it will be sent after successful payment verification

    } catch (error) {
        console.error('Error during booking creation transaction:', error);
        if (session.inTransaction()) {
            try { await session.abortTransaction(); console.log("Transaction aborted due to error."); }
            catch (abortError) { console.error("Error aborting transaction:", abortError); }
        }
        next(error);
    } finally {
        if (session) { session.endSession(); console.log("Booking session ended."); }
    }
};


// --- Cancel Booking Function (UPDATED WITH EMAIL) ---
exports.cancelBooking = async function(req, res, next) {
    const { bookingId } = req.params;
    const userId = req.user?.userId || req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: 'Invalid Booking ID format.' });
    }

    let updatedBooking; // To store the result after update

    try {
        // Find the booking and populate details needed for checks AND email
        const booking = await Booking.findById(bookingId)
            .populate({ // <<< Populate showtime deeply for email details
                path: 'showtime_id',
                select: 'start_time screen_id movie_id',
                populate: [
                    { path: 'movie_id', select: 'title' },
                    {
                        path: 'screen_id',
                        select: 'screen_number theater_id',
                        populate: { path: 'theater_id', select: 'name city' }
                    }
                ]
            })
            .populate('user_id', 'name email') // <<< Populate user for email
            .lean(); // <<< Use lean as we primarily read data here before update

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // Authorization Check
        if (booking.user_id._id.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to cancel this booking.' });
        }

        // Status Check
        const cancellableStatuses = ['active', 'paid'];
        if (!cancellableStatuses.includes(booking.status)) {
             return res.status(400).json({ message: `This booking cannot be cancelled (status: ${booking.status}).` });
        }

        // Nested Data Check (for email content)
        const showtime = booking.showtime_id;
        const movie = showtime?.movie_id;
        const screen = showtime?.screen_id;
        const theater = screen?.theater_id;
        const user = booking.user_id; // Get populated user details

        if (!showtime || !movie || !screen || !theater || !user || !user.email) {
            console.error(`Cancellation Error: Missing populated data for booking ${bookingId}. Cannot proceed or send email.`);
            // Don't cancel if we can't get details needed later (like for email/refund)
            return res.status(500).json({ message: 'Internal error: Could not retrieve all booking details for cancellation.' });
        }

        // Cancellation Cutoff Logic
        const showtimeStartTime = new Date(showtime.start_time);
        const currentTime = new Date();
        const cancellationCutoffHours = 2; // Example: 2 hours
        const cancellationCutoffMillis = cancellationCutoffHours * 60 * 60 * 1000;

        if ((showtimeStartTime.getTime() - currentTime.getTime()) <= cancellationCutoffMillis) {
            return res.status(400).json({ message: `Cancellation deadline passed. Cannot cancel less than ${cancellationCutoffHours} hours before the show.` });
        }

        // --- Update Booking Status ---
        // Use findByIdAndUpdate to change the status
        updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                status: 'user_cancelled',
                payment_status: booking.payment_status === 'paid' ? 'refund_pending' : 'cancelled' // Example logic
            },
            { new: true } // Return the updated document
        ).lean(); // <<< Use lean here too if only reading the result

        if (!updatedBooking) {
             // If the update failed for some reason after finding it initially
             return res.status(500).json({ message: 'Failed to update booking status during cancellation.' });
        }

        console.log(`Booking ${bookingId} cancelled by user ${userId}. Status: ${updatedBooking.status}, Payment Status: ${updatedBooking.payment_status}.`);

        // --- SUCCESS RESPONSE (Sent before potentially slow email) ---
        res.status(200).json({ message: 'Booking cancelled successfully.', booking: updatedBooking });


        // --- Send Cancellation Confirmation Email (Asynchronously after response) ---
        (async () => { // IIAFE for isolated async operation
            try {
                console.log(`Preparing cancellation email for booking ${updatedBooking._id} to user ${user.email}`);

                // Get seat numbers from the original booking data (before lean potentially modified it)
                const seatNumbersString = booking.booked_seats?.map(s => s.seat_number).filter(Boolean).join(', ') || 'N/A';

                // Construct HTML content
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h1 style="color: #4a4a4a;">Cineplus Booking Cancellation Confirmation</h1>
                        <p>Hi ${user.name || 'Valued Customer'},</p>
                        <p>This email confirms that your Cineplus booking has been successfully cancelled.</p>
                        <div style="border: 1px solid #eee; padding: 15px; margin-top: 10px; background-color: #f9f9f9;">
                            <h2 style="margin-top: 0; color: #555;">Cancelled Booking Details:</h2>
                            <p><strong>Booking ID:</strong> ${updatedBooking._id}</p>
                            <p><strong>Movie:</strong> ${movie.title}</p>
                            <p><strong>Theater:</strong> ${theater.name} (${theater.city})</p>
                            <p><strong>Screen:</strong> ${screen.screen_number}</p>
                            <p><strong>Original Show Date & Time:</strong> ${new Date(showtime.start_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</p>
                            <p><strong>Seats Cancelled:</strong> ${seatNumbersString}</p>
                            <p><strong>Booking Status:</strong> ${updatedBooking.status}</p>
                            <p><strong>Payment Status:</strong> ${updatedBooking.payment_status}</p> <!-- Show refund status -->
                        </div>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        ${updatedBooking.payment_status === 'refund_pending'
                            ? '<p>If a payment was made, a refund (if applicable according to policy) has been initiated. Please allow 5-7 business days for it to reflect in your account.</p>'
                            : '<p>Thank you for using Cineplus.</p>'
                        }
                        <p>Best regards,<br/><strong>The Cineplus Team</strong></p>
                    </div>
                `;
                // Simplified text version
                const emailText = `... (text version confirming cancellation and refund status) ...`;

                // Send the email
                await sendEmail({
                    email: user.email,
                    subject: `❌ Cineplus Booking Cancelled: ${movie.title}`,
                    html: emailHtml,
                    message: emailText
                });
                // Success log is inside sendEmail utility

            } catch (emailError) {
                // Log email sending failure, but don't fail the overall cancellation process
                console.error(`ALERT: Booking ${updatedBooking?._id} cancelled successfully, but failed to send cancellation email to ${user?.email}. Error: ${emailError.message}`, emailError);
                // Log to monitoring system if available
            }
        })(); // End IIAFE for email sending

    } catch (error) {
        console.error(`Error cancelling booking ${bookingId}:`, error);
        next(error); // Pass to global error handler
    }
};


// --- Get My Bookings Function ---
// (Keep the corrected getMyBookings function from the previous response)
exports.getMyBookings = async function(req, res, next) {
    try {
        const userId = req.user?.userId || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        const bookings = await Booking.find({ user_id: userId })
            .populate({
                path: 'showtime_id',
                select: 'start_time screen_id movie_id',
                populate: [
                    { path: 'movie_id', select: 'title poster_url' },
                    {
                        path: 'screen_id',
                        select: 'screen_number theater_id',
                        populate: { path: 'theater_id', select: 'name city'}
                    }
                ]
            })
            .sort({ booking_date: -1 })
            .lean();

        const formattedBookings = bookings.map(booking => {
            const showtime = booking.showtime_id;
            const movie = showtime?.movie_id;
            const screen = showtime?.screen_id;
            const theater = screen?.theater_id;
            const seatNumbers = booking.booked_seats?.map(bs => bs.seat_number).filter(Boolean).join(', ') || 'N/A';
            const numberOfSeats = booking.booked_seats?.length || 0;

            return {
                _id: booking._id,
                booking_date: booking.booking_date || booking.createdAt,
                total_amount: booking.total_amount,
                status: booking.status,
                payment_status: booking.payment_status,
                start_time: showtime?.start_time,
                movie_title: movie?.title ?? 'N/A',
                poster_url: movie?.poster_url ?? '/default_poster.jpg',
                theater_name: theater?.name ?? 'N/A',
                theater_city: theater?.city ?? 'N/A',
                screen_number: screen?.screen_number ?? 'N/A',
                seat_numbers: seatNumbers,
                number_of_seats: numberOfSeats,
            };
        });

        res.status(200).json(formattedBookings);

    } catch (error) {
        console.error('Error fetching user booking history:', error);
        next(error);
    }
};


// --- Verify Ticket Function (Theater Admin/Staff) ---
// (Keep the corrected verifyTicket function from the previous response)
exports.verifyTicket = async function(req, res, next) {
    const { bookingId, showtimeId } = req.body;
    const verifierUserId = req.user?.userId || req.user?._id;
    const verifierTheaterId = req.user?.theater_id?.toString();

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: 'Invalid Booking ID format.' });
    }
    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
        return res.status(400).json({ message: 'Invalid Showtime ID format.' });
    }
    if (!verifierUserId) {
        return res.status(401).json({ message: 'Verifier not authenticated.' });
    }
    if (!verifierTheaterId) {
         return res.status(403).json({ message: 'User not authorized to verify tickets (missing theater association).' });
    }

    try {
        const booking = await Booking.findById(bookingId)
            .populate({
                path: 'showtime_id',
                select: 'start_time screen_id movie_id',
                populate: [
                    {
                        path: 'screen_id',
                        select: 'theater_id screen_number',
                        populate: { path: 'theater_id', select: 'name _id' }
                    },
                    { path: 'movie_id', select: 'title' }
                ]
            })
            .populate('user_id', 'name email')
            .populate('booked_seats.seat_id', 'seat_number');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (booking.showtime_id._id.toString() !== showtimeId) {
            return res.status(400).json({ message: 'Ticket is not valid for this specific showtime.' });
        }

        const theaterIdFromBooking = booking.showtime_id?.screen_id?.theater_id?._id?.toString();
        if (!theaterIdFromBooking) {
             console.error(`Verification Error: Could not determine theater ID for booking ${bookingId}`);
             return res.status(500).json({ message: 'Internal error: Cannot determine ticket theater.' });
        }
        if (theaterIdFromBooking !== verifierTheaterId) {
             console.log(`Authorization Failed: Verifier from theater ${verifierTheaterId} (User: ${verifierUserId}) attempted to verify ticket for theater ${theaterIdFromBooking}`);
            return res.status(403).json({ message: 'Not authorized to verify tickets for this theater.' });
        }

        const acceptableStates = ['active', 'paid'];
        if (!acceptableStates.includes(booking.status) || booking.payment_status !== 'paid') {
            return res.status(400).json({
                message: `Ticket cannot be verified. (Status: ${booking.status}, Payment: ${booking.payment_status}). Must be active/paid.`
            });
        }

        // Update status to 'accepted'
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { status: 'accepted' },
            { new: true }
        ).lean(); // Use lean if just reading the result

        const response = {
            success: true,
            message: 'Ticket verified successfully!',
            booking_id: updatedBooking._id,
            movie_title: booking.showtime_id?.movie_id?.title ?? 'N/A',
            start_time: booking.showtime_id.start_time,
            theater_name: booking.showtime_id?.screen_id?.theater_id?.name ?? 'N/A',
            screen_number: booking.showtime_id?.screen_id?.screen_number ?? 'N/A',
            user_name: booking.user_id?.name ?? 'N/A',
            user_email: booking.user_id?.email ?? 'N/A',
            seat_numbers: booking.booked_seats?.map(seat => seat.seat_id?.seat_number ?? 'N/A') || [],
            status: updatedBooking.status
        };

        res.status(200).json(response);

    } catch (error) {
        console.error(`Error verifying ticket ${bookingId} for showtime ${showtimeId} by user ${verifierUserId}:`, error);
        next(error);
    }
};

// --- Auto-cancel stale pending bookings (no payment within 15 minutes) ---
exports.cancelStalePendingBookings = async function() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    try {
        const result = await Booking.updateMany(
            {
                payment_status: 'pending',
                status: 'pending',
                createdAt: { $lte: fifteenMinutesAgo }
            },
            {
                $set: { payment_status: 'failed', status: 'cancelled' }
            }
        );
        console.log(`[Cron] Auto-cancelled stale bookings >15m: matched=${result.matchedCount ?? result.n}, modified=${result.modifiedCount ?? result.nModified}`);
        return { success: true, matched: result.matchedCount ?? result.n, modified: result.modifiedCount ?? result.nModified };
    } catch (err) {
        console.error('[Cron] Error auto-cancelling stale bookings:', err);
        return { success: false, error: err.message };
    }
};