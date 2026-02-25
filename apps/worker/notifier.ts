import nodemailer from "nodemailer";

// In a real app, you would use an environment variable for your SMTP settings or API key
// For this demo, we'll use a mock logger that simulates sending an email.
const isEmailEnabled = process.env.EMAIL_ENABLED === "true";

export async function sendEmailAlert(targetEmail: string, websiteUrl: string, status: "Up" | "Down") {
    const subject = status === "Down"
        ? `🚨 ALERT: ${websiteUrl} is DOWN!`
        : `✅ RECOVERY: ${websiteUrl} is back UP`;

    const body = status === "Down"
        ? `We detected that your website ${websiteUrl} is currently unresponsive. Our monitoring agents are continuing to check the status.`
        : `Good news! Your website ${websiteUrl} has recovered and is responding to check requests normally.`;

    console.log(`\n--- [EMAIL NOTIFICATION] ---`);
    console.log(`To: ${targetEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${body}`);
    console.log(`---------------------------\n`);

    if (isEmailEnabled) {
        // Example configuration for a real SMTP server (like Gmail, Resend, or Mailgun)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.example.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        try {
            await transporter.sendMail({
                from: '"BetterUptime Monitoring" <alerts@betteruptime.com>',
                to: targetEmail,
                subject: subject,
                text: body,
                html: `<p>${body}</p>`,
            });
            console.log(`Real email sent to ${targetEmail}`);
        } catch (error) {
            console.error("Failed to send real email:", error);
        }
    }
}
