import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: {
        provider: "sqlite",
        url: ":memory:"
    },
    secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-key-for-development",
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        magicLink({
            async sendMagicLink(data) {
                try {
                    // Check if Resend API key is configured
                    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key-here') {
                        console.log("⚠️ Resend API key not configured. Magic link:", data.url);
                        return;
                    }

                    // Send magic link email via Resend
                    const { error } = await resend.emails.send({
                        from: 'Breadcrumbs <onboarding@resend.dev>',
                        to: [data.email],
                        subject: '🍞 Sign in to Breadcrumbs',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <h1 style="font-size: 24px; color: #333; margin: 0;">🍞 Breadcrumbs</h1>
                                    <p style="color: #666; margin: 10px 0;">Your personal link manager</p>
                                </div>

                                <div style="background-color: #f9f9f9; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                                    <h2 style="color: #333; margin: 0 0 15px 0;">Sign in to your account</h2>
                                    <p style="color: #666; margin: 0 0 20px 0;">Click the button below to securely sign in to your Breadcrumbs account:</p>

                                    <div style="text-align: center;">
                                        <a href="${data.url}"
                                           style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                            Sign in to Breadcrumbs
                                        </a>
                                    </div>
                                </div>

                                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                                    <p style="margin: 0; color: #856404; font-size: 14px;">
                                        <strong>🔒 Security note:</strong> This link will expire in 5 minutes and can only be used once.
                                    </p>
                                </div>

                                <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
                                    <p style="color: #999; font-size: 12px; margin: 0;">
                                        If you didn't request this email, you can safely ignore it.
                                    </p>
                                </div>
                            </div>
                        `,
                    });

                    if (error) {
                        console.error('Failed to send magic link email:', error);
                        // Fallback to console log if email fails
                        console.log("📧 Email failed, magic link:", data.url);
                    } else {
                        console.log('✅ Magic link email sent successfully to:', data.email);
                    }
                } catch (error) {
                    console.error('Error sending magic link email:', error);
                    // Fallback to console log if email fails
                    console.log("📧 Email error, magic link:", data.url);
                }
            },
        }),
    ]
});

export type Session = typeof auth.$Infer.Session;