import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
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