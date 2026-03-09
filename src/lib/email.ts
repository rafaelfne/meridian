import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: "Meridian <noreply@mrdn.pro>",
    to,
    subject: "Reset your Meridian password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="margin-bottom: 1rem;">Reset your password</h2>
        <p style="color: #555; line-height: 1.6;">
          We received a request to reset your password. Click the button below to choose a new password.
        </p>
        <a
          href="${resetUrl}"
          style="display: inline-block; margin: 1.5rem 0; padding: 0.75rem 1.5rem; background-color: #111; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;"
        >
          Reset Password
        </a>
        <p style="color: #888; font-size: 0.875rem; line-height: 1.5;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
