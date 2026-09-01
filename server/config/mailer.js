require('dotenv').config();

async function sendOtpEmail(toEmail, otpCode) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'Habit Tracker', email: process.env.EMAIL_USER },
      to: [{ email: toEmail }],
      subject: 'Your Habit Tracker verification code',
      textContent: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
      htmlContent: `<p>Your verification code is <b>${otpCode}</b>. It expires in 10 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errText}`);
  }
}

module.exports = { sendOtpEmail };