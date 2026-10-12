import nodemailer from "nodemailer";

export interface SendApprovalEmailOptions {
    to: string;
    firstName: string;
    lastName: string;
    email: string;
    plainPassword: string;
}

export async function sendTrialApprovalEmail(options: SendApprovalEmailOptions): Promise<void> {
    const { to, firstName, lastName, email, plainPassword } = options;

    const html = `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>Platformamizga xush kelibsiz</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">HR Platform</h1>
      <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Sinov muddati arizangiz tasdiqlandi!</p>
    </div>
    <div style="padding: 32px 24px;">
      <p style="font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 12px; color: #0f172a;">
        Hurmatli ${firstName} ${lastName},
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
        Platformamizga xush kelibsiz! Sizning sinov muddatiga bo'lgan arizangiz muvaffaqiyatli tasdiqlandi. Tizimga kirish uchun ma'lumotlaringiz:
      </p>
      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #cbd5e1;">
        <div style="margin-bottom: 14px;">
          <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Login:</span>
          <span style="font-size: 15px; font-weight: 600; color: #0f172a; font-family: monospace;">${email}</span>
        </div>
        <div>
          <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Parol:</span>
          <span style="font-size: 16px; font-weight: 700; color: #7c3aed; font-family: monospace; letter-spacing: 0.05em;">${plainPassword}</span>
        </div>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 28px;">
        Xavfsizlik maqsadida tizimga kirganingizdan so'ng parolingizni o'zgartirishingiz tavsiya etiladi.
      </p>
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.3);">
          Tizimga kirish
        </a>
      </div>
    </div>
    <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        Ushbu xabar avtomatik tarzda yuborilgan.
      </p>
    </div>
  </div>
</body>
</html>
`;

    const subject = "Platformamizga xush kelibsiz! Tizimga kirish uchun ma'lumotlar";
    const text = `Platformamizga xush kelibsiz!\nTizimga kirish uchun ma'lumotlar:\nLogin: ${email}\nParol: ${plainPassword}`;

    try {
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to,
                subject,
                text,
                html,
            });
            return;
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            const fromAddress = process.env.RESEND_FROM || "HR Platform <onboarding@resend.dev>";
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                    from: fromAddress,
                    to: [to],
                    subject,
                    text,
                    html,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Resend API error:", response.status, errorBody);
            }
        }
    } catch (error) {
        console.error("Failed to send approval email:", error);
    }
}
