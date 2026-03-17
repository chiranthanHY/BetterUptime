import nodemailer from "nodemailer";

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
        const senderEmail = process.env.SMTP_USER!;

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: senderEmail,
                pass: process.env.SMTP_PASS,
            },
        });

        try {
            await transporter.sendMail({
                from: `"BetterUptime Monitoring" <${senderEmail}>`,  // must match SMTP_USER for Gmail
                to: targetEmail,
                subject: subject,
                text: body,
                html: `<p>${body}</p>`,
            });
            console.log(`✅ Real email sent to ${targetEmail}`);
        } catch (error) {
            console.error(`❌ Failed to send email to ${targetEmail}:`, error);
        }
    }
}
