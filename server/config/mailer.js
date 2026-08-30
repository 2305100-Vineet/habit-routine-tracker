const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendOtpEmail(toEmail, otpCode) {
  await transporter.sendMail({
    from: `"Habit Tracker" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Habit Tracker verification code',
    text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <b>${otpCode}</b>. It expires in 10 minutes.</p>`,
  });
}

module.exports = { sendOtpEmail };