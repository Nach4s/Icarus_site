const nodemailer = require('nodemailer');

// ── Configure Nodemailer Transporter ────────────────────────
// Using Gmail SMTP. Note: For Gmail, ensure 2-Step Verification 
// is enabled and use an App Password for EMAIL_PASS.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends a visually styled 6-digit OTP verification email.
 * @param {string} toEmail 
 * @param {string} otpCode 
 * @param {string} userName
 */
async function sendVerificationEmail(toEmail, otpCode, userName) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("\n⚠️ WARNING: EMAIL_USER or EMAIL_PASS not set in .env!");
        console.warn(`Simulating email to ${toEmail} with code: ${otpCode}\n`);
        return true; 
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333;">
                <h1 style="color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 30px;">
                    Welcome to ICARUS
                </h1>
                <p style="color: #a3a3a3; font-size: 16px; margin-bottom: 20px;">
                    Hello ${userName},<br/>
                    Please verify your email address to access the platform.
                </p>
                
                <div style="background-color: #0f0f0f; border: 1px solid #c28827; padding: 20px; border-radius: 8px; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 0.3em; color: #d97706; font-family: monospace;">
                        ${otpCode}
                    </span>
                </div>
                
                <p style="color: #737373; font-size: 12px;">
                    If you did not request this, please ignore this email.
                </p>
            </div>
            <p style="color: #525252; font-size: 10px; margin-top: 20px; text-transform: uppercase;">
                © 2026 ICARUS Platform
            </p>
        </div>
    `;

    const mailOptions = {
        from: `"ICARUS Support" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Verify Your ICARUS Account',
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent successfully to ${toEmail}`);
        return true;
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email. Please check your SMTP configuration.");
    }
}

module.exports = {
    sendVerificationEmail
};
