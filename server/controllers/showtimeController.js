// backend/controllers/showtimeController.js

const mongoose = require('mongoose');
const moment = require('moment-timezone'); // Use moment-timezone

// Import Mongoose Models
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Screen = require('../models/Screen');
const Theater = require('../models/Theater');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

// Define Target Timezone and Buffer
const TARGET_TIMEZONE = 'Asia/Kolkata';
const BUFFER_TIME_MINUTES = 15;

// --- Helper Functions ---

/**
 * Gets the start and end Moment objects for a given date string in the target timezone.
 * Returns UTC Date objects for DB query.
 */
const getDateRangeForTimezone = (dateString, timezone) => {
    const start = moment.tz(dateString, 'YYYY-MM-DD', timezone).startOf('day');
    const end = moment.tz(dateString, 'YYYY-MM-DD', timezone).endOf('day');
    return { start, end };
};

/**
 * Gets the start and end Moment objects for a specific time window on a given date,
 * interpreted within the target timezone. Returns Moment objects representing UTC boundaries.
 */
const getShowTimingBoundariesForTimezone = (dateStr, timing, timezone) => {
    const targetDateInTimezone = moment.tz(dateStr, 'YYYY-MM-DD', timezone);
    if (!targetDateInTimezone.isValid()) return null;
    let startHourLocal, endHourLocal, endMinuteLocal = 59;
    switch (timing) {
        case 'EarlyMorning': startHourLocal = 0; endHourLocal = 8; break;
        case 'Morning':      startHourLocal = 9; endHourLocal = 11; break;
        case 'Afternoon':    startHourLocal = 12; endHourLocal = 15; break;
        case 'Evening':      startHourLocal = 16; endHourLocal = 19; break;
        case 'Night':        startHourLocal = 20; endHourLocal = 23; break;
        default: return null;
    }
    const startTime = targetDateInTimezone.clone().hour(startHourLocal).minute(0).second(0).millisecond(0);
    const endTime = targetDateInTimezone.clone().hour(endHourLocal).minute(endMinuteLocal).second(59).millisecond(999);
    return { startTime, endTime };
};

/**
 * Parses a price range string into min/max values.
 */
const parsePriceRange = (rangeString) => {
    if (!rangeString || rangeString === "Any" || rangeString === "") return { minPrice: 0, maxPrice: Infinity };
    if (rangeString === "300+") return { minPrice: 300, maxPrice: Infinity };
    const parts = rangeString.split('-');
    if (parts.length === 2) {
        const min = parseFloat(parts[0]); const max = parseFloat(parts[1]);
        if (!isNaN(min) && !isNaN(max)) return { minPrice: min, maxPrice: max };
    }
    console.warn(`Invalid price range format: ${rangeString}`);
    return { minPrice: 0, maxPrice: Infinity };
};

/**
 * Fetches the ObjectIds (as strings) of actively booked seats for a given showtime.
 */
async function getBookedSeatIdsSetForShowtime(showtimeId) {
    if (!mongoose.Types.ObjectId.isValid(showtimeId)) return new Set();
    const paidBookings = await Booking.find({ 
        showtime_id: showtimeId, 
        payment_status: 'paid' 
    }).select('booked_seats.seat_id').lean();
    const bookedIds = new Set();
    paidBookings.forEach(booking => { 
        booking.booked_seats.forEach(seat => { 
            if (seat?.seat_id) bookedIds.add(seat.seat_id.toString()); 
        }); 
    });
    return bookedIds;
}

/**
 * Checks if a given screen has a specified number of consecutive available seats for a showtime.
 */
const hasConsecutiveAvailableSeats = (seatsForScreen, bookedSeatIdStringSet, requiredSeats) => {
    if (!seatsForScreen || seatsForScreen.length < requiredSeats || requiredSeats <= 0) return false;
    const seatsByRow = seatsForScreen.reduce((acc, seat) => {
        const row = seat.row || 'UNKNOWN'; if (!acc[row]) acc[row] = []; acc[row].push(seat); return acc;
    }, {});
    for (const row in seatsByRow) seatsByRow[row].sort((a, b) => a.number_in_row - b.number_in_row);
    for (const row in seatsByRow) {
        let consecutiveAvailable = 0;
        for (const seat of seatsByRow[row]) {
            if (!bookedSeatIdStringSet.has(seat._id.toString())) { consecutiveAvailable++; if (consecutiveAvailable >= requiredSeats) return true; }
            else consecutiveAvailable = 0;
        }
    } return false;
};

/**
 * Formats an array of showtime documents for frontend display.
 * Fetches booked seat count for each showtime.
 * **UPDATED**: Includes movie_title.
 */
const formatShowtimesWithAvailability = async (showtimes) => {
    if (!Array.isArray(showtimes)) return [];

    const showtimeIds = showtimes.map(s => s._id);
    // Optimization: Fetch only necessary fields for booking calculation
    const allBookedSeatsInfo = await Booking.find({
        showtime_id: { $in: showtimeIds },
        payment_status: 'paid'
    }).select('showtime_id booked_seats.seat_id').lean();

    // Create a map for quick lookup of booked seats per showtime
    const bookedSeatIdsByShowtime = allBookedSeatsInfo.reduce((acc, booking) => {
        const showtimeIdStr = booking.showtime_id.toString();
        if (!acc[showtimeIdStr]) acc[showtimeIdStr] = new Set();
        booking.booked_seats.forEach(seat => {
            if (seat?.seat_id) {
                acc[showtimeIdStr].add(seat.seat_id.toString());
            }
        });
        return acc;
    }, {});

    // Map over the input showtimes and format them
    return showtimes.map(showtime => {
        // Ensure showtime and nested properties exist before accessing them
        const showtimeIdStr = showtime._id.toString();
        const bookedSeats = bookedSeatIdsByShowtime[showtimeIdStr] || new Set();
        const totalSeats = showtime.screen_id?.total_seats ?? 0; // Use optional chaining and nullish coalescing

        return {
            _id: showtime._id, // Use _id as the identifier
            movie_title: showtime.movie_id?.title ?? 'Unknown Movie', // <<< ADDED: Include movie title
            theater_name: showtime.theater_id?.name ?? 'N/A', // Populated elsewhere if needed
            theater_id: showtime.theater_id?._id, // Populated elsewhere if needed
            screen_number: showtime.screen_id?.screen_number ?? 'N/A',
            screen_id: showtime.screen_id?._id,
            screen_format: showtime.screen_id?.format ?? 'N/A', // Example additional field
            start_time: showtime.start_time, // Keep original Date/ISO format
            status: showtime.status,
            language: showtime.language,
            booked_seats_count: bookedSeats.size,
            total_seats: totalSeats
        };
    });
};


/**
 * Checks if two time intervals overlap.
 * @param {moment.Moment} startA Start moment of interval A
 * @param {moment.Moment} endA End moment of interval A
 * @param {moment.Moment} startB Start moment of interval B
 * @param {moment.Moment} endB End moment of interval B
 * @returns {boolean} True if intervals overlap, false otherwise.
 */
const intervalsOverlap = (startA, endA, startB, endB) => {
    // Ensure moments are valid before comparing
    if (!startA?.isValid() || !endA?.isValid() || !startB?.isValid() || !endB?.isValid()) {
        console.warn("[intervalsOverlap] Received invalid moment object(s).");
        return false; // Treat invalid input as non-overlapping or handle as error
    }
    // Overlap exists if A starts before B ends AND A ends after B starts
    return startA.isBefore(endB) && endA.isAfter(startB);
};

// --- Controller: Get Showtimes by Movie with Filters (Optimized) ---
exports.getShowtimesByMovie = async (req, res, next) => {
    const { movieId } = req.params;
    const { city, date, language, showTiming, numberOfTickets, priceRange } = req.query;

    try {
        // Basic Validation
        if (!mongoose.Types.ObjectId.isValid(movieId)) return res.status(400).json({ message: 'Invalid Movie ID format.' });
        if (!city || !date || !moment(date, 'YYYY-MM-DD', true).isValid()) return res.status(400).json({ message: 'City and a valid Date (YYYY-MM-DD) are required.' });
        const requiredSeats = numberOfTickets ? parseInt(numberOfTickets, 10) : 0;
        if (isNaN(requiredSeats) || requiredSeats < 0) return res.status(400).json({ message: 'Invalid number of tickets specified.' });

        // Prepare Base Query using IST
        const { start: dateStart, end: dateEnd } = getDateRangeForTimezone(date, TARGET_TIMEZONE);
        //console.log(`[ShowtimeController] Querying for IST date ${date} -> UTC range: ${dateStart.toISOString()} to ${dateEnd.toISOString()}`);

        const theatersInCity = await Theater.find({ city: city }).select('_id').lean();
        if (theatersInCity.length === 0) return res.json({ showtimes: [], availableLanguages: [] });
        const theaterIdsInCity = theatersInCity.map(t => t._id);

        const showtimeFilter = {
            movie_id: movieId,
            theater_id: { $in: theaterIdsInCity },
            start_time: { $gte: dateStart.toDate(), $lte: dateEnd.toDate() },
            status: 'scheduled'
        };

        if (language) { showtimeFilter.language = language; }

        if (showTiming) {
            const timingBoundaries = getShowTimingBoundariesForTimezone(date, showTiming, TARGET_TIMEZONE);
            if (timingBoundaries) {
                console.log(`[ShowtimeController] Applying IST timing filter '${showTiming}' -> UTC range: ${timingBoundaries.startTime.toISOString()} to ${timingBoundaries.endTime.toISOString()}`);
                const effectiveStartTime = moment.max(timingBoundaries.startTime, dateStart);
                const effectiveEndTime = moment.min(timingBoundaries.endTime, dateEnd);
                showtimeFilter.start_time = { $gte: effectiveStartTime.toDate(), $lte: effectiveEndTime.toDate() };
            } else { console.warn(`Invalid showTiming value: ${showTiming}`); }
        }
        //console.log('[ShowtimeController] Initial Showtime Query:', JSON.stringify(showtimeFilter));

        // Execute Initial Showtime Query
        let initialShowtimes = await Showtime.find(showtimeFilter)
            .populate('theater_id', 'name') // Populate fields needed for potential filtering/display
            .populate('screen_id', 'screen_number total_seats format') // Populate fields needed
            .populate('movie_id', 'title') // <<< ADDED: Populate movie title for formatter
            .select('start_time language status screen_id theater_id movie_id _id') // select necessary fields + _id
            .lean();
        //console.log(`[ShowtimeController] Found ${initialShowtimes.length} initial showtimes.`);

        // Fetch Available Languages
        const { start: langDateStart, end: langDateEnd } = getDateRangeForTimezone(date, TARGET_TIMEZONE);
        const baseLanguageFilter = {
            movie_id: movieId, theater_id: { $in: theaterIdsInCity },
            start_time: { $gte: langDateStart.toDate(), $lte: langDateEnd.toDate() }, status: 'scheduled'
        };
        const distinctLanguages = await Showtime.distinct('language', baseLanguageFilter);
        const availableLanguages = distinctLanguages.filter(Boolean);

        // Prepare for Post-Filtering
        const { minPrice, maxPrice } = parsePriceRange(priceRange);
        const applyPriceFilter = minPrice > 0 || maxPrice !== Infinity;
        const applySeatFilter = requiredSeats > 0;

        // If no post-filtering is needed, format with availability and return
        if (!applyPriceFilter && !applySeatFilter) {
            const formattedShowtimes = await formatShowtimesWithAvailability(initialShowtimes);
            return res.json({ showtimes: formattedShowtimes, availableLanguages });
        }

        if (initialShowtimes.length === 0) {
             return res.json({ showtimes: [], availableLanguages });
        }

        // OPTIMIZED Post-Filtering
        const screenIds = [...new Set(initialShowtimes.map(s => s.screen_id?._id).filter(id => id && mongoose.Types.ObjectId.isValid(id)))];
        const allSeatsForScreens = screenIds.length > 0 ? await Seat.find({ screen_id: { $in: screenIds } }).select('screen_id price row number_in_row').sort({ screen_id: 1, row: 1, number_in_row: 1 }).lean() : [];
        const seatsByScreen = allSeatsForScreens.reduce((acc, seat) => { const screenIdStr = seat.screen_id.toString(); if (!acc[screenIdStr]) acc[screenIdStr] = []; acc[screenIdStr].push(seat); return acc; }, {});

        const showtimeIds = initialShowtimes.map(s => s._id);
        const allBookedSeatsInfo = await Booking.find({ showtime_id: { $in: showtimeIds }, payment_status: 'paid' }).select('showtime_id booked_seats.seat_id').lean();
        const bookedSeatIdsByShowtime = allBookedSeatsInfo.reduce((acc, booking) => { const showtimeIdStr = booking.showtime_id.toString(); if (!acc[showtimeIdStr]) acc[showtimeIdStr] = new Set(); booking.booked_seats.forEach(seat => { if (seat?.seat_id) acc[showtimeIdStr].add(seat.seat_id.toString()); }); return acc; }, {});

        // Perform Filtering in Memory
        const filteredShowtimes = initialShowtimes.filter(showtime => {
            const screenId = showtime.screen_id?._id; const showtimeIdStr = showtime._id.toString();
            const totalSeatsOnScreen = showtime.screen_id?.total_seats ?? 0; const screenIdStr = screenId?.toString();
            if (!screenIdStr || !seatsByScreen[screenIdStr]) { console.warn(`[Filter] Skipping ${showtimeIdStr}: Missing screen/seat info.`); return false; }
            const bookedSeatIdSet = bookedSeatIdsByShowtime[showtimeIdStr] || new Set();
            const seatsForThisScreen = seatsByScreen[screenIdStr];

            let priceMatch = !applyPriceFilter; // Price Filter Check
            if (applyPriceFilter && !seatsForThisScreen.some(seat => !bookedSeatIdSet.has(seat._id.toString()) && seat.price >= minPrice && seat.price <= maxPrice)) priceMatch = false;
            if (!priceMatch) return false;

            let seatMatch = !applySeatFilter; // Consecutive Seat Filter Check
            if (applySeatFilter) {
                const availableSeatCount = totalSeatsOnScreen - bookedSeatIdSet.size;
                seatMatch = availableSeatCount >= requiredSeats && hasConsecutiveAvailableSeats(seatsForThisScreen, bookedSeatIdSet, requiredSeats);
            }
            return priceMatch && seatMatch;
        });
        console.log(`[ShowtimeController] ${filteredShowtimes.length} showtimes after post-filtering.`);

        // Format final results with availability (formatter will add movie_title)
        const formattedFinalShowtimes = await formatShowtimesWithAvailability(filteredShowtimes);
        res.json({ showtimes: formattedFinalShowtimes, availableLanguages });

    } catch (error) {
        console.error('Error fetching showtimes by movie:', error);
        next(error);
    }
};

// --- Controller: Create Single Showtime (with Conflict Validation) ---
exports.createShowtime = async (req, res, next) => {
    console.log("[CreateShowtime] Request received.");
    const { screenId } = req.params;
    const { movie_id, start_time, language } = req.body;

    try {
        // 1. Basic Validation
        if (!movie_id || !screenId || !start_time || !language) return res.status(400).json({ message: 'Movie ID, Screen ID, Start Time, and Language are required.' });
        if (!mongoose.Types.ObjectId.isValid(movie_id)) return res.status(400).json({ message: 'Invalid Movie ID format.' });
        if (!mongoose.Types.ObjectId.isValid(screenId)) return res.status(400).json({ message: 'Invalid Screen ID format.' });

        // 2. Parse New Showtime Time (as IST)
        const newShowStartTimeMoment = moment.tz(start_time, TARGET_TIMEZONE);
        if (!newShowStartTimeMoment.isValid()) return res.status(400).json({ message: `Invalid start_time format. Use recognizable format (e.g., YYYY-MM-DDTHH:mm) for ${TARGET_TIMEZONE}.` });
        if (newShowStartTimeMoment.isBefore(moment.tz(TARGET_TIMEZONE))) return res.status(400).json({ message: 'Show start time cannot be in the past.' });

        // 3. Fetch New Movie and Screen Info
        const [newMovie, screenExists] = await Promise.all([
            Movie.findById(movie_id).select('_id duration languages').lean(),
            Screen.findById(screenId).select('theater_id').lean()
        ]);
        if (!newMovie) return res.status(404).json({ message: 'Selected movie not found.' });
        if (!screenExists) return res.status(404).json({ message: 'Selected screen not found.' });
        if (typeof newMovie.duration !== 'number' || newMovie.duration <= 0) return res.status(400).json({ message: 'Invalid movie duration. Cannot schedule.' });
        if (!newMovie.languages?.includes(language)) return res.status(400).json({ message: `Language '${language}' not available for this movie.` });

        // 4. Calculate New Show's Occupied Time Window (including buffer)
        const newShowEndTimeMoment = newShowStartTimeMoment.clone().add(newMovie.duration, 'minutes').add(BUFFER_TIME_MINUTES, 'minutes');
        console.log(`[CreateShowtime] Proposed Interval (IST): ${newShowStartTimeMoment.format()} - ${newShowEndTimeMoment.format()}`);

        // 5. Find Potentially Conflicting Existing Showtimes
        const potentialConflicts = await Showtime.find({
            screen_id: screenId,
            status: 'scheduled',
            start_time: { $lt: newShowEndTimeMoment.toDate() } // Optimization: only fetch shows starting before the new one ends
        }).populate('movie_id', 'duration title').lean(); // Populate needed fields
        console.log(`[CreateShowtime] Found ${potentialConflicts.length} potential conflicts for screen ${screenId}.`);

        // 6. Check for Actual Overlaps
        for (const existingShow of potentialConflicts) {
             if (!existingShow.movie_id || typeof existingShow.movie_id.duration !== 'number' || existingShow.movie_id.duration <= 0) {
                 console.warn(`[CreateShowtime] Skipping conflict check for existing show ${existingShow._id} due to invalid movie data.`);
                 continue;
             }
             const existingShowStartTimeMoment = moment.tz(existingShow.start_time, TARGET_TIMEZONE);
             // Don't add buffer to existing show start time for comparison
             const existingShowEndTimeMoment = existingShowStartTimeMoment.clone().add(existingShow.movie_id.duration, 'minutes').add(BUFFER_TIME_MINUTES, 'minutes');

             // Refined Overlap Check: Ensure existing show actually ends after the new one starts
             // AND use the helper function for clarity
             if (existingShowEndTimeMoment.isAfter(newShowStartTimeMoment) &&
                 intervalsOverlap(newShowStartTimeMoment, newShowEndTimeMoment, existingShowStartTimeMoment, existingShowEndTimeMoment)) {
                 console.log(`[CreateShowtime] Conflict Detected!`);
                 const conflictMsg = `Time conflict: This show overlaps with '${existingShow.movie_id.title}' scheduled from ${existingShowStartTimeMoment.format('h:mm A')} to ${existingShowEndTimeMoment.clone().subtract(BUFFER_TIME_MINUTES, 'minutes').format('h:mm A')} on this screen.`;
                 return res.status(409).json({ message: conflictMsg });
             }
        }

        // 7. No Conflicts Found - Proceed to Create
        console.log(`[CreateShowtime] No time conflicts found. Creating showtime.`);
        const newShowtimeData = {
            movie_id, screen_id: screenId, theater_id: screenExists.theater_id, // Denormalize theater_id
            start_time: newShowStartTimeMoment.toDate(), // Store as UTC Date
            language, status: 'scheduled'
        };
        const newShowtime = await Showtime.create(newShowtimeData);

        // 8. Notify interested users (booking now available)
        try {
            const theaterId = screenExists.theater_id;
            const movieId = newMovie._id;

            const interestedUsers = await User.find({
                movieNotifications: movieId,
                likedTheaters: theaterId
            }).select('email name').lean();

            if (interestedUsers && interestedUsers.length > 0) {
                const theater = await Theater.findById(theaterId).select('name city').lean();
                const movie = await Movie.findById(movieId).select('title').lean();
                const startTimeLocal = moment.tz(newShowStartTimeMoment, TARGET_TIMEZONE).format('MMM D, YYYY h:mm A');

                const emailSubject = `Booking now open: ${movie?.title || 'A movie'} at ${theater?.name || 'your liked theater'}`;
                for (const u of interestedUsers) {
                    const html = `
                        <div style="font-family: Arial, Helvetica, sans-serif; padding:16px">
                            <h2 style="margin:0 0 12px">Booking Now Available</h2>
                            <p>Hi ${u.name || 'there'},</p>
                            <p>Booking has started for <strong>${movie?.title || 'the movie'}</strong> at <strong>${theater?.name || 'your liked theater'}</strong>${theater?.city ? `, ${theater.city}` : ''}.</p>
                            <p>First show: <strong>${startTimeLocal} (${TARGET_TIMEZONE})</strong></p>
                            <p style="margin-top:16px">Open the app to book your seats now.</p>
                            <hr/>
                            <p style="font-size:12px;color:#666">You received this because you enabled notifications for this movie in your liked theatres. You can turn this off from the movie page.</p>
                        </div>`;
                    const text = `Booking Now Available\n\nMovie: ${movie?.title || ''}\nTheatre: ${theater?.name || ''}${theater?.city ? ', ' + theater.city : ''}\nFirst show: ${startTimeLocal} (${TARGET_TIMEZONE})\n\nOpen the app to book your seats. You can turn off notifications on the movie page.`;
                    try {
                        await sendEmail({ email: u.email, subject: emailSubject, html, message: text });
                    } catch (e) {
                        console.error('Failed to send booking available email to', u.email, e.message);
                    }
                }
            }
        } catch (notifyErr) {
            console.error('Error during booking availability notifications:', notifyErr);
        }

        res.status(201).json({ message: 'Showtime created successfully', showtime: newShowtime });

    } catch (error) {
        console.error('Error creating showtime:', error);
        if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join('. ') });
        // Duplicate key error on index (e.g., if unique index exists on screen+time)
        if (error.code === 11000) return res.status(409).json({ message: 'A showtime already exists at this exact time (potential race condition or duplicate entry).' });
        next(error); // Pass to global error handler
    }
};


// --- Controller: Update Showtime ---
// NOTE: Conflict validation on update (if time/screen changes) is NOT implemented here for brevity.
exports.updateShowtime = async (req, res, next) => {
    console.log("[UpdateShowtime] Request received.");
    const { showtimeId } = req.params;
    const { movie_id, screen_id, start_time, language, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(showtimeId)) return res.status(400).json({ message: 'Invalid Showtime ID format.' });

    const updateData = {};
    let screenCheckRequired = false;
    let timeCheckRequired = false; // Flag for conflict check if time changes

    // Validate and prepare update fields
    if (movie_id !== undefined) { if (!mongoose.Types.ObjectId.isValid(movie_id)) return res.status(400).json({ message: 'Invalid Movie ID.' }); updateData.movie_id = movie_id; /* TODO: Fetch new movie duration if conflict check needed */ }
    if (screen_id !== undefined) { if (!mongoose.Types.ObjectId.isValid(screen_id)) return res.status(400).json({ message: 'Invalid Screen ID.' }); updateData.screen_id = screen_id; screenCheckRequired = true; /* Conflict check needed */ }
    if (start_time !== undefined) { const startTimeMoment = moment.tz(start_time, TARGET_TIMEZONE); if (!startTimeMoment.isValid()) return res.status(400).json({ message: 'Invalid start_time format.' }); updateData.start_time = startTimeMoment.toDate(); timeCheckRequired = true; /* Conflict check needed */ }
    if (language !== undefined) { if (typeof language !== 'string' || language.trim() === '') return res.status(400).json({ message: 'Language cannot be empty.' }); updateData.language = language.trim(); }
    if (status !== undefined) { if (!['scheduled', 'cancelled', 'completed'].includes(status)) return res.status(400).json({ message: 'Invalid status.' }); updateData.status = status; }

    if (Object.keys(updateData).length === 0) return res.status(400).json({ message: 'No valid fields provided for update.' });

    try {
        // TODO: Implement conflict validation if screen_id or start_time changes.
        // This requires fetching the original show, calculating the new interval,
        // querying potential conflicts (excluding the current show), and checking overlap.
        if (screenCheckRequired || timeCheckRequired) {
            console.warn("[UpdateShowtime] Conflict validation for updates is recommended but not implemented.");
            // Placeholder for where the check would go
        }

        // If screen changes, update denormalized theater_id
        if (screenCheckRequired && updateData.screen_id) { // Ensure screen_id is in updateData
            const screen = await Screen.findById(updateData.screen_id).select('theater_id').lean();
            if (!screen) return res.status(404).json({ message: 'Target screen not found.' });
            updateData.theater_id = screen.theater_id; // Update denormalized theater ID
        }

        const updatedShowtime = await Showtime.findByIdAndUpdate(showtimeId, { $set: updateData }, { new: true, runValidators: true });
        if (!updatedShowtime) return res.status(404).json({ message: 'Showtime not found.' });

        res.json({ message: 'Showtime updated successfully', showtime: updatedShowtime });

    } catch (error) {
        console.error('Error updating showtime:', error);
        if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join('. ') });
        if (error.code === 11000) return res.status(409).json({ message: 'Update failed due to conflict with another showtime.' });
        next(error);
    }
};

// --- Controller: Delete (Cancel) Showtime ---
exports.deleteShowtime = async (req, res, next) => {
    console.log("[DeleteShowtime] Request received.");
    const { showtimeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(showtimeId)) return res.status(400).json({ message: 'Invalid Showtime ID format.' });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const showtime = await Showtime.findById(showtimeId).session(session);
        if (!showtime) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ message: 'Showtime not found.' }); }
        if (showtime.status === 'cancelled' || showtime.status === 'completed') { await session.abortTransaction(); session.endSession(); return res.status(400).json({ message: `Showtime is already ${showtime.status}.` }); }

        // Update Showtime status to 'cancelled'
        showtime.status = 'cancelled';
        await showtime.save({ session }); // Use save to trigger potential middleware

        // Update related *active* Bookings to 'cancelled'
        const bookingUpdateResult = await Booking.updateMany(
            { showtime_id: showtimeId, status: 'active' },
            { $set: { status: 'cancelled' } },
            { session }
        );
        console.log(`[DeleteShowtime] Cancelled ${bookingUpdateResult.modifiedCount} active bookings for showtime ${showtimeId}`);
        // TODO: Implement refund logic or notification if needed

        await session.commitTransaction();
        res.json({ message: 'Showtime cancelled successfully', cancelledShowtimeId: showtimeId });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error cancelling showtime:', error);
        next(error); // Pass to global error handler
    } finally {
        session.endSession();
    }
};


// --- Controller: Get Showtimes by Theater (Admin/Theater Admin) ---
// ** UPDATED: Ensures correct population for formatShowtimesWithAvailability **
// backend/controllers/showtimeController.js
// ... (imports and other helper functions remain the same) ...

// --- Controller: Get Showtimes by Theater (Admin/Theater Admin) ---
// ** UPDATED: Added screenNumber filter **
exports.getShowtimesByTheater = async (req, res, next) => {
    const theaterIdFromParams = req.params.theaterId;
    // <<< Destructure screenNumber from query
    const { date: filterDate, movieName: filterMovieName, screenNumber: filterScreenNumber } = req.query;
    let targetTheaterId;

    try {
        // Determine target theater ID based on role/params (same logic as before)
        if (theaterIdFromParams) {
            if (!mongoose.Types.ObjectId.isValid(theaterIdFromParams)) {
                return res.status(400).json({ message: 'Invalid Theater ID format provided in URL.' });
            }
            targetTheaterId = theaterIdFromParams;
        } else if (req.user?.role === 'theater_admin') {
            const theater = await Theater.findOne({ user_id: req.user.userId }).select('_id').lean();
            if (!theater) {
                return res.status(404).json({ message: 'No theater associated with this admin account.' });
            }
            targetTheaterId = theater._id;
        } else if (req.user?.role === 'admin') {
            return res.status(400).json({ message: 'Admin must specify a theater ID in the URL.' });
        } else {
            return res.status(401).json({ message: 'Unauthorized or Theater ID not determinable.' });
        }

        // Build base query object
        const query = { theater_id: targetTheaterId };
        let movieTitleFilterRegex = null;

        // Apply Date Filter
        if (filterDate) {
            if (!moment(filterDate, 'YYYY-MM-DD', true).isValid()) {
                return res.status(400).json({ message: 'Invalid date format (YYYY-MM-DD).' });
            }
            const { start, end } = getDateRangeForTimezone(filterDate, TARGET_TIMEZONE);
            query.start_time = { $gte: start.toDate(), $lte: end.toDate() };
            console.log(`[GetByTheater] Filtering for theater ${targetTheaterId} on IST date ${filterDate}`);
        } else {
            console.log(`[GetByTheater] No date filter applied for theater ${targetTheaterId}.`);
        }

        // Prepare Movie Name Filter (applied after fetching)
        if (filterMovieName && filterMovieName.trim() !== '') {
            movieTitleFilterRegex = new RegExp(filterMovieName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            console.log(`[GetByTheater] Preparing movie title filter containing: "${filterMovieName.trim()}"`);
        }

        // <<< Apply Screen Number Filter (if provided) >>>
        let screenObjectIds = null; // Store ObjectIds of matching screens
        if (filterScreenNumber && filterScreenNumber.trim() !== '') {
            const screenNumberCleaned = filterScreenNumber.trim();
            console.log(`[GetByTheater] Filtering for screen number: "${screenNumberCleaned}"`);
            // Find screen(s) with that number within the target theater
            const matchingScreens = await Screen.find({
                theater_id: targetTheaterId,
                screen_number: screenNumberCleaned // Exact match on screen number
            }).select('_id').lean();

            if (matchingScreens.length === 0) {
                // If no screen matches the filter, no showtimes can possibly match
                console.log(`[GetByTheater] No screen found with number "${screenNumberCleaned}" in theater ${targetTheaterId}. Returning empty.`);
                return res.json([]); // Return empty array directly
            }
            // Get the ObjectIds of the matching screen(s)
            screenObjectIds = matchingScreens.map(screen => screen._id);
            // Add the screen_id filter to the main query
            query.screen_id = { $in: screenObjectIds };
        }
        // <<< End Screen Number Filter Logic >>>

        // --- Fetch showtimes with necessary fields populated ---
        let showtimes = await Showtime.find(query)
            .populate('movie_id', 'title')
            .populate('screen_id', 'screen_number total_seats format') // Added format field
            .select('start_time language status screen_id movie_id _id')
            .sort({ start_time: 1 })
            .lean();

        // Apply movie name filter AFTER population
        if (movieTitleFilterRegex) {
            showtimes = showtimes.filter(st => st.movie_id && movieTitleFilterRegex.test(st.movie_id.title));
        }

        // Format results including availability
        const formattedShowtimes = await formatShowtimesWithAvailability(showtimes);

        res.json(formattedShowtimes); // Send the formatted data

    } catch (error) {
        console.error(`Error fetching showtimes for theater ${targetTheaterId || '(undetermined)'}:`, error);
        next(error);
    }
};

// ... (rest of showtimeController.js remains the same) ...

// --- Controller: Get Detailed Showtime Info by ID (Public) ---
exports.getShowtimeDetailsById = async (req, res, next) => {
    const { showtimeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(showtimeId)) return res.status(400).json({ message: 'Invalid Showtime ID format.' });

    try {
        const showtime = await Showtime.findById(showtimeId)
            .populate('movie_id') // Populate full movie doc
            .populate({
                 path: 'screen_id',
                 select: 'screen_number theater_id total_seats format', // Include format if available
                 populate: {
                     path: 'theater_id',
                     select: 'name city location' // Select desired theater fields
                 }
            })
            .lean(); // Use lean for performance

        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });
        if (!showtime.screen_id || !showtime.screen_id.theater_id) {
             console.warn(`Showtime ${showtimeId} found, but missing screen or theater references.`);
             // Handle this case gracefully - maybe return partial data or an error
             return res.status(404).json({ message: 'Showtime data incomplete (missing screen/theater).' });
        }

        // Structure response clearly
        const response = {
             showtime_id: showtime._id,
             start_time: showtime.start_time,
             show_language: showtime.language,
             showtime_status: showtime.status,

             movie: showtime.movie_id ? { // Check if movie was populated successfully
                 movie_id: showtime.movie_id._id,
                 title: showtime.movie_id.title,
                 genre: showtime.movie_id.genre,
                 duration: showtime.movie_id.duration,
                 poster_url: showtime.movie_id.poster_url,
                 languages: showtime.movie_id.languages,
                 description: showtime.movie_id.description,
                 rating: showtime.movie_id.rating,
                 release_date: showtime.movie_id.release_date,
                 trailer_url: showtime.movie_id.trailer_url
             } : null, // Return null if movie population failed

             screen: { // Already checked screen_id exists
                 screen_id: showtime.screen_id._id,
                 screen_number: showtime.screen_id.screen_number,
                 total_seats: showtime.screen_id.total_seats,
                 format: showtime.screen_id.format || 'N/A' // Include format if exists
             },

             theater: { // Already checked theater_id exists via screen_id
                 theater_id: showtime.screen_id.theater_id._id,
                 name: showtime.screen_id.theater_id.name,
                 city: showtime.screen_id.theater_id.city,
                 location: showtime.screen_id.theater_id.location
             }
        };
        res.json(response);
    } catch (error) {
        console.error('Error fetching showtime details:', error);
        next(error); // Pass to global error handler
    }
};


// --- Controller: Add Multiple Showtimes (with Full Conflict Validation) ---
exports.addMultipleShowtimes = async (req, res, next) => {
    console.log("[AddMultiple] Request received.");
    const { movieId, theaterId, screenId, startDate, endDate, showTimes, language } = req.body;

    // 1. Input Validation
    if (!movieId || !theaterId || !screenId || !startDate || !endDate || !showTimes || !language) return res.status(400).json({ message: 'All fields are required.' });
    if (!mongoose.Types.ObjectId.isValid(movieId) || !mongoose.Types.ObjectId.isValid(theaterId) || !mongoose.Types.ObjectId.isValid(screenId)) return res.status(400).json({ message: 'Invalid ID format.' });
    const startMoment = moment.tz(startDate, 'YYYY-MM-DD', TARGET_TIMEZONE).startOf('day');
    const endMoment = moment.tz(endDate, 'YYYY-MM-DD', TARGET_TIMEZONE).endOf('day');
    if (!startMoment.isValid() || !endMoment.isValid() || startMoment.isAfter(endMoment)) return res.status(400).json({ message: `Invalid date range (IST). Start date must be before or same as end date.` });
    if (startMoment.isBefore(moment.tz(TARGET_TIMEZONE).startOf('day'))) return res.status(400).json({ message: 'Start date cannot be in the past.' }); // Prevent adding past shows

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/; // Simple HH:mm format
    const requestedTimes = showTimes.split(',')
        .map(t => t.trim())
        .filter(time => timeRegex.test(time)); // Filter out invalid formats

    if (requestedTimes.length === 0) return res.status(400).json({ message: 'No valid HH:mm times provided. Please use comma-separated HH:mm format (e.g., 09:00,14:30,21:00).' });
    if (requestedTimes.length !== showTimes.split(',').map(t => t.trim()).length) console.warn("[AddMultiple] Some provided times were in invalid format and ignored.");

    const session = await mongoose.startSession();
    session.startTransaction();
    console.log("[AddMultiple] Transaction started.");

    try {
        // 2. Fetch Essential Data (within transaction)
        const [movie, screenExists] = await Promise.all([
            Movie.findById(movieId).select('_id duration languages title').session(session).lean(), // Added title
            Screen.findOne({ _id: screenId, theater_id: theaterId }).select('_id').session(session).lean() // Verify screen belongs to theater
        ]);
        if (!movie) throw new Error('Movie not found.'); // Use throw to trigger catch block
        if (!screenExists) throw new Error('Screen not found or does not belong to the specified theater.');
        if (typeof movie.duration !== 'number' || movie.duration <= 0) throw new Error(`Selected movie '${movie.title || 'ID: '+movieId}' has an invalid duration.`);
        if (!movie.languages?.includes(language)) throw new Error(`Language '${language}' not available for movie '${movie.title}'.`);
        const newMovieDuration = movie.duration;

        // 3. Fetch Existing Shows for Conflict Check (within date range + buffer)
        // Calculate broader range to catch overlaps at boundaries
        const checkRangeStart = startMoment.clone().subtract(newMovieDuration + BUFFER_TIME_MINUTES, 'minutes');
        const checkRangeEnd = endMoment.clone().add(newMovieDuration + BUFFER_TIME_MINUTES, 'minutes');

        const existingShows = await Showtime.find({
            screen_id: screenId, // Only check the target screen
            status: 'scheduled', // Only conflict with scheduled shows
            start_time: { $gte: checkRangeStart.toDate(), $lte: checkRangeEnd.toDate() } // Efficiently query relevant time window
        }).populate('movie_id', 'duration title').session(session).lean(); // Populate title too

        // Pre-calculate intervals for existing shows (using IST)
        const existingShowIntervals = existingShows.map(show => {
            if (!show.movie_id?.duration || show.movie_id.duration <= 0) {
                console.warn(`[AddMultiple] Existing show ${show._id} on screen ${screenId} has invalid movie data. Skipping precise conflict check.`); return null;
            }
            const start = moment.tz(show.start_time, TARGET_TIMEZONE); // Convert stored UTC to IST Moment
            const end = start.clone().add(show.movie_id.duration, 'minutes').add(BUFFER_TIME_MINUTES, 'minutes'); // End time in IST (with buffer)
            return { start, end, title: show.movie_id.title, originalStartTime: moment.tz(show.start_time, TARGET_TIMEZONE) };
        }).filter(Boolean); // Filter out nulls (shows with bad data)
        console.log(`[AddMultiple] Found ${existingShowIntervals.length} existing scheduled shows on screen ${screenId} for conflict check within the relevant time window.`);

        // 4. Generate Candidate Showtimes & Perform Validation
        const validShowtimesToInsert = [];
        const candidateIntervals = []; // Store intervals of candidates validated so far (within this batch)
        const nowInTimezone = moment.tz(TARGET_TIMEZONE); // Use consistent timezone check
        let currentMoment = startMoment.clone(); // Start from the beginning of the range

        while (currentMoment.isSameOrBefore(endMoment, 'day')) { // Loop through each day in the range
            for (const timeStr of requestedTimes) { // Loop through each requested time slot
                // Combine date and time, interpret in target timezone
                const candidateStartTime = moment.tz(`${currentMoment.format('YYYY-MM-DD')} ${timeStr}`, 'YYYY-MM-DD HH:mm', TARGET_TIMEZONE);

                if (!candidateStartTime.isValid()) {
                    console.warn(`[AddMultiple] Skipping invalid time combination: ${currentMoment.format('YYYY-MM-DD')} ${timeStr}`);
                    continue;
                }
                // Skip if the calculated start time is in the past (relative to now in IST)
                if (candidateStartTime.isBefore(nowInTimezone)) {
                    console.log(`[AddMultiple] Skipping past show (based on current IST): ${candidateStartTime.format()}`);
                    continue;
                }

                // Calculate end time in IST (with buffer)
                const candidateEndTime = candidateStartTime.clone().add(newMovieDuration, 'minutes').add(BUFFER_TIME_MINUTES, 'minutes');

                // A. Check against EXISTING shows fetched earlier
                for (const existing of existingShowIntervals) {
                    if (intervalsOverlap(candidateStartTime, candidateEndTime, existing.start, existing.end)) {
                         // Conflict found! Abort the whole operation.
                         const conflictMsg = `Conflict: Proposed show for '${movie.title}' at ${candidateStartTime.format('MMM D, YYYY, h:mm A')} (IST) on screen ${screenId} overlaps with existing show '${existing.title}' scheduled from ${existing.originalStartTime.format('h:mm A')} to ${existing.end.clone().subtract(BUFFER_TIME_MINUTES, 'minutes').format('h:mm A')} (IST).`;
                         // Throw error with specific HTTP status hint for the catch block
                         throw Object.assign(new Error(conflictMsg), { cause: { httpStatus: 409 } });
                    }
                }

                // B. Check against OTHER CANDIDATES already validated in THIS batch
                for (const previousCandidate of candidateIntervals) {
                     if (intervalsOverlap(candidateStartTime, candidateEndTime, previousCandidate.start, previousCandidate.end)) {
                         // Self-conflict within the batch! Abort the whole operation.
                         const conflictMsg = `Conflict: Proposed show at ${candidateStartTime.format('MMM D, h:mm A')} (IST) overlaps with another show you are trying to add at ${previousCandidate.start.format('MMM D, h:mm A')} (IST) in this same request. Please adjust the times.`;
                         // Throw error with specific HTTP status hint
                         throw Object.assign(new Error(conflictMsg), { cause: { httpStatus: 409 } });
                     }
                }

                // --- If NO CONFLICTS found (passed existing and batch checks) ---
                candidateIntervals.push({ start: candidateStartTime, end: candidateEndTime }); // Add validated interval for future batch checks
                validShowtimesToInsert.push({
                    movie_id: movieId,
                    screen_id: screenId,
                    theater_id: theaterId, // Denormalize theater ID
                    start_time: candidateStartTime.toDate(), // Store as UTC Date object
                    language,
                    status: 'scheduled', // Default status
                });
            }
            currentMoment.add(1, 'day'); // Move to the next day
        }

        // 5. Insert Valid Showtimes (if any)
        if (validShowtimesToInsert.length === 0) {
            // No error, but nothing to add (all were past, invalid, or conflicted internally before finding issues with existing)
            await session.commitTransaction(); // Commit (as no failed writes occurred)
            console.log("[AddMultiple] No valid future showtimes generated to add based on criteria and existing schedule. Transaction committed (no writes).");
            session.endSession();
            return res.status(200).json({ message: 'No valid future showtimes could be added. They might be in the past or conflict with requested times.' });
        }

        console.log(`[AddMultiple] Attempting to insert ${validShowtimesToInsert.length} valid showtimes.`);
        const result = await Showtime.insertMany(validShowtimesToInsert, { session }); // Perform bulk insert within transaction

        // 6. Commit Transaction & Respond
        await session.commitTransaction();
        console.log(`[AddMultiple] Successfully inserted ${result.length} showtimes for movie '${movie.title}' on screen ${screenId}. Transaction committed.`);
        session.endSession();
        res.status(201).json({
             message: `Successfully added ${result.length} showtimes for '${movie.title}' between ${startDate} and ${endDate} (IST).`
             // Potential enhancement: Could report how many were skipped due to being in the past.
        });

    } catch (error) {
        console.error('[AddMultiple] Error caught:', error.message);
        // Ensure transaction is aborted on any error during the process
        if (session.inTransaction()) {
             await session.abortTransaction();
             console.log("[AddMultiple] Transaction aborted due to error.");
        }
        session.endSession(); // Always end the session

        // Check if it's a conflict error we threw intentionally with status hint
        if (error.cause?.httpStatus === 409) {
            return res.status(409).json({ message: error.message });
        }
        // Handle potential DB errors during insertMany (e.g., unique index violation if not caught by logic)
        if (error.name === 'BulkWriteError' && error.code === 11000) {
             console.error('[AddMultiple] BulkWriteError (Duplicate Key):', error.writeErrors);
             return res.status(409).json({ message: 'Conflict detected during database insert (unexpected duplicate). This might indicate a timing issue or data inconsistency. Please review and try again.' });
        }
        // Handle other specific errors we threw (like 'Movie not found')
        if (error.message.includes('Movie not found') || error.message.includes('Screen not found') || error.message.includes('invalid duration') || error.message.includes('Language') || error.message.includes('not available')) {
            return res.status(404).json({ message: error.message }); // Use 404 for not found resources
        }

        // Pass other unexpected errors to the global handler, or return a generic 500
        console.error('[AddMultiple] Unexpected Error:', error); // Log the full error for debugging
        res.status(500).json({ message: error.message || 'An unexpected server error occurred while adding multiple showtimes.' });
        // Alternatively use: next(error); if you have a robust global error handler
    }
};


// --- Controller: Scheduled Task - Update Past Showtimes to 'completed' ---
// NOTE: Ideally run by a job scheduler (like node-cron, Agenda.js), not an HTTP endpoint unless protected.
exports.updateShowtimeStatusesToCompleted = async (/* req, res, next - if exposed */) => {
    try {
        const nowInTimezone = moment.tz(TARGET_TIMEZONE);
        // Define "past": Shows whose *calculated end time* (start + duration) is, e.g., 30 mins ago.
        // This requires fetching shows, calculating end times, then updating.
        // Simpler approach: Mark shows as completed if start_time was > N hours ago.
        const timeThreshold = nowInTimezone.clone().subtract(4, 'hours'); // Shows that started > 4 hours ago in IST
        console.log(`[Scheduler] Running status update. Current IST: ${nowInTimezone.format()}. Threshold UTC: ${timeThreshold.toISOString()}`);

        const result = await Showtime.updateMany(
            {
                 status: 'scheduled', // Only update scheduled shows
                 start_time: { $lte: timeThreshold.toDate() } // Where start time is before the threshold
            },
            {
                 $set: { status: 'completed' } // Set status to completed
            }
        );

        if (result.modifiedCount > 0) {
             console.log(`[Scheduler] Updated ${result.modifiedCount} showtimes to 'completed'.`);
        } else {
             console.log('[Scheduler] No scheduled showtimes needed status update based on the threshold.');
        }
        return { success: true, updated: result.modifiedCount }; // For internal calls/logging
    } catch (error) {
        console.error('[Scheduler] Error updating showtime statuses:', error);
        return { success: false, error: error.message };
    }
};