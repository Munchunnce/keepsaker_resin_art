import nodemailer from 'nodemailer';
import { SMTP_MAIL, SMTP_PASSWORD } from '../config/index.js';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: SMTP_MAIL,
            pass: SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `LuxeResin Art <${process.env.SMTP_MAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.message, // Hum HTML invoice bhejenge
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;