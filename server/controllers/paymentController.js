// backend/controllers/paymentController.js

const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ----------------------------------------------------
// Create Razorpay Order
// ----------------------------------------------------
const createOrder = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;

        console.log('Creating order for:', {
            amount,
            bookingId
        });

        if (!amount || !bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Amount and bookingId are required'
            });
        }

        // Fetch booking from database
        const booking = await Booking.findById(bookingId).lean();

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Prefer backend booking amount
        const bookingAmount = Number(booking.total_amount);
        const requestedAmount = Number(amount);

        const payable = Number.isFinite(bookingAmount) && bookingAmount > 0 ?
            bookingAmount :
            requestedAmount;

        if (!Number.isFinite(payable) || payable <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment amount'
            });
        }

        const options = {
            amount: Math.round(payable * 100), // INR → paise
            currency: 'INR',
            receipt: `receipt_${bookingId}`,
            payment_capture: 1
        };

        console.log('Creating Razorpay order:', options);

        const order = await razorpay.orders.create(options);

        console.log('Razorpay order created:', order);

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);

        return res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// ----------------------------------------------------
// Verify Razorpay Payment
// ----------------------------------------------------
const verifyPayment = async (req, res) => {
    console.log('Payment verification request received:', req.body);

    try {
        const {
            order_id,
            payment_id,
            signature,
            bookingId
        } = req.body;

        // Validate required fields
        if (!order_id || !payment_id || !signature || !bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields for payment verification'
            });
        }

        // Verify Razorpay signature
        const generatedSignature = crypto
            .createHmac(
                'sha256',
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(`${order_id}|${payment_id}`)
            .digest('hex');

        if (generatedSignature !== signature) {
            console.error('Razorpay signature verification failed');

            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Find booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        console.log('Booking found:', booking._id);

        // Prevent duplicate payment records
        const existingPayment = await Payment.findOne({
            transaction_id: payment_id
        });

        if (existingPayment) {
            return res.status(200).json({
                success: true,
                message: 'Payment already verified',
                booking
            });
        }

        // Create payment record
        const payment = new Payment({
            booking_id: bookingId,
            booking_amount: booking.total_amount,
            payment_status: 'Success',
            payment_provider: 'Razorpay',
            transaction_id: payment_id
        });

        await payment.save();

        console.log('Payment record created:', payment._id);

        // Update booking
        booking.payment_status = 'paid';
        booking.status = 'active';
        booking.payment_id = payment._id;

        await booking.save();

        console.log('Booking payment status updated successfully');

        // ------------------------------------------------
        // Send booking confirmation email
        // ------------------------------------------------
        try {
            const User = require('../models/User');
            const sendEmail = require('../utils/emailService');

            const populatedBooking = await Booking.findById(bookingId)
                .populate({
                    path: 'showtime_id',
                    select: 'start_time screen_id movie_id',
                    populate: [{
                        path: 'movie_id',
                        select: 'title'
                    },
                    {
                        path: 'screen_id',
                        select: 'screen_number theater_id',
                        populate: {
                            path: 'theater_id',
                            select: 'name city'
                        }
                    }
                    ]
                })
                .lean();

            if (!populatedBooking) {
                console.warn(
                    'Booking not found while preparing confirmation email'
                );
            } else {
                const user = await User.findById(
                    populatedBooking.user_id
                )
                    .select('name email')
                    .lean();

                if (user && user.email) {
                    const movie = populatedBooking.showtime_id ?
                        populatedBooking.showtime_id.movie_id :
                        null;

                    const screen = populatedBooking.showtime_id ?
                        populatedBooking.showtime_id.screen_id :
                        null;

                    const theater = screen ?
                        screen.theater_id :
                        null;

                    const seatNumbersString = (
                        populatedBooking.booked_seats || []
                    )
                        .map((seat) => seat.seat_number)
                        .join(', ');

                    let formattedDateTime = 'N/A';

                    if (
                        populatedBooking.showtime_id &&
                        populatedBooking.showtime_id.start_time
                    ) {
                        formattedDateTime = new Date(
                            populatedBooking.showtime_id.start_time
                        ).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: true
                        });
                    }

                    const customerName =
                        user.name || 'Valued Customer';

                    const movieTitle =
                        movie && movie.title ?
                            movie.title :
                            'the show';

                    const theaterName =
                        theater && theater.name ?
                            theater.name :
                            'N/A';

                    const theaterCity =
                        theater && theater.city ?
                            ` (${theater.city})` :
                            '';

                    const screenNumber =
                        screen && screen.screen_number ?
                            screen.screen_number :
                            'N/A';

                    const totalPaid = Number(
                        populatedBooking.total_amount || 0
                    ).toFixed(2);

                    const emailHtml = `
                        <div style="
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 650px;
                            margin: 0 auto;
                        ">

                            <h1 style="
                                color: #4a4a4a;
                                text-align: center;
                            ">
                                XavierCinema Booking Confirmation
                            </h1>

                            <p>
                                Hi ${customerName},
                            </p>

                            <p>
                                Thank you! Your payment was successful.
                                Here are your booking details:
                            </p>

                            <div style="
                                border: 1px solid #eee;
                                padding: 20px;
                                margin-top: 15px;
                                background-color: #f9f9f9;
                                border-radius: 8px;
                            ">

                                <h2 style="
                                    margin-top: 0;
                                    color: #555;
                                ">
                                    Booking Summary
                                </h2>

                                <p>
                                    <strong>Booking ID:</strong>
                                    ${populatedBooking._id}
                                </p>

                                <p>
                                    <strong>Movie:</strong>
                                    ${movieTitle}
                                </p>

                                <p>
                                    <strong>Theater:</strong>
                                    ${theaterName}${theaterCity}
                                </p>

                                <p>
                                    <strong>Screen:</strong>
                                    ${screenNumber}
                                </p>

                                <p>
                                    <strong>Date & Time:</strong>
                                    ${formattedDateTime}
                                </p>

                                <p>
                                    <strong>Seats:</strong>
                                    ${seatNumbersString || 'N/A'}
                                </p>

                                <p>
                                    <strong>Total Paid:</strong>
                                    ₹${totalPaid}
                                </p>
                            </div>

                            <hr style="
                                border: none;
                                border-top: 1px solid #eee;
                                margin: 25px 0;
                            ">

                            <p>
                                Please show this email or your
                                XavierCinema booking details at the
                                theater entrance.
                            </p>

                            <p>
                                Enjoy your movie!
                            </p>

                            <p>
                                — The XavierCinema Team
                            </p>

                        </div>
                    `;

                    const emailText = `
XavierCinema Booking Confirmation

Hi ${customerName},

Your payment was successful.

Booking ID: ${populatedBooking._id}
Movie: ${movieTitle}
Theater: ${theaterName}${theaterCity}
Screen: ${screenNumber}
Date & Time: ${formattedDateTime}
Seats: ${seatNumbersString || 'N/A'}
Total Paid: ₹${totalPaid}

Please show your booking details at the theater entrance.

Enjoy your movie!

— The XavierCinema Team
                    `.trim();

                    await sendEmail({
                        email: user.email,
                        subject: `Payment Successful — Your XavierCinema Tickets for ${movieTitle}`,
                        html: emailHtml,
                        message: emailText
                    });

                    console.log(
                        `Confirmation email sent to ${user.email}`
                    );
                }
            }

        } catch (emailError) {
            // Email failure should not invalidate successful payment
            console.error(
                'Failed to send confirmation email:',
                emailError
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            booking
        });

    } catch (error) {
        console.error(
            'Error verifying payment:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ?
                error.stack :
                undefined
        });
    }
};

// ----------------------------------------------------
// Mark Payment Failed
// ----------------------------------------------------
const markPaymentFailed = async (req, res) => {
    try {
        const {
            bookingId,
            reason
        } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'bookingId is required'
            });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Only update pending payments
        if (booking.payment_status === 'pending') {
            booking.payment_status = 'failed';
            booking.status = 'cancelled';

            await booking.save();
        }

        console.log(
            `Payment failed for booking ${bookingId}`,
            reason ? `Reason: ${reason}` : ''
        );

        return res.status(200).json({
            success: true,
            booking
        });

    } catch (error) {
        console.error(
            'Error marking payment failed:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Failed to mark payment as failed'
        });
    }
};

// ----------------------------------------------------
// Export Controllers
// ----------------------------------------------------
module.exports = {
    createOrder,
    verifyPayment,
    markPaymentFailed
};