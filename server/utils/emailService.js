// backend/utils/emailService.js

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM ||
            `"XavierCinema" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);

        console.log(
            `Email sent successfully to ${options.email}: ${info.messageId}`
        );

        return info;
    } catch (error) {
        console.error(
            `Error sending email to ${options.email}:`,
            error.message
        );

        throw new Error(
            `Email could not be sent. Reason: ${error.message}`
        );
    }
};

module.exports = sendEmail;