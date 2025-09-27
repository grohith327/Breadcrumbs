import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

// Magic link handler
async function handleMagicLink(request: NextRequest) {
  try {
    const { email, callbackURL } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate a secure token for the magic link
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store verification token in Convex
    await convex.mutation(api.auth.createVerification, {
      identifier: email,
      value: token,
      expiresAt,
    });

    // Create magic link URL
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicLink = `${baseURL}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}&callbackURL=${encodeURIComponent(callbackURL || baseURL)}`;

    // Send magic link email
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your-resend-api-key-here') {
      const { error } = await resend.emails.send({
        from: 'Breadcrumbs <onboarding@resend.dev>',
        to: [email],
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
                <a href="${magicLink}"
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
        console.log("📧 Email failed, magic link:", magicLink);
      } else {
        console.log('✅ Magic link email sent successfully to:', email);
      }
    } else {
      console.log("⚠️ Resend API key not configured. Magic link:", magicLink);
    }

    return NextResponse.json({ message: "Magic link sent", sent: true });

  } catch (error) {
    console.error("Error in magic link handler:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Magic link verification handler
async function handleVerify(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const callbackURL = searchParams.get('callbackURL') || '/';

    if (!token || !email) {
      return NextResponse.redirect(new URL('/auth/error', request.url));
    }

    // Verify token in Convex
    const verification = await convex.query(api.auth.getVerification, {
      identifier: email,
      value: token,
    });

    if (!verification || verification.expiresAt < Date.now()) {
      return NextResponse.redirect(new URL('/auth/error', request.url));
    }

    // Delete used verification token
    await convex.mutation(api.auth.deleteVerification, {
      identifier: email,
      value: token,
    });

    // Create or get user
    let user = await convex.query(api.auth.getUser, { email });
    if (!user) {
      const userId = await convex.mutation(api.auth.createUser, {
        email,
        name: email.split('@')[0], // Use email prefix as default name
      });
      // Fetch the user after creation to get the complete object
      user = await convex.query(api.auth.getUserById, { userId });
      if (!user) {
        throw new Error("Failed to create user");
      }
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const sessionExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await convex.mutation(api.auth.createSession, {
      userId: user._id,
      token: sessionToken,
      expiresAt: sessionExpiresAt,
    });

    // Set session cookie and redirect
    const response = NextResponse.redirect(new URL(callbackURL, request.url));
    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;

  } catch (error) {
    console.error("Error in verify handler:", error);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
}

// Session handler
async function handleSession(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Get session from Convex
    const session = await convex.query(api.auth.getSessionByToken, {
      token: sessionToken,
    });

    if (!session || session.expiresAt < Date.now()) {
      // Session expired, clear cookie
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete('session-token');
      return response;
    }

    // Get user data
    const user = await convex.query(api.auth.getUserById, {
      userId: session.userId,
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });

  } catch (error) {
    console.error("Error in session handler:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

// Logout handler
async function handleLogout(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value;

    if (sessionToken) {
      // Delete session from Convex
      await convex.mutation(api.auth.deleteSession, {
        token: sessionToken,
      });
    }

    // Clear session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session-token');
    return response;

  } catch (error) {
    console.error("Error in logout handler:", error);
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session-token');
    return response;
  }
}

export async function POST(request: NextRequest) {
  const pathname = new URL(request.url).pathname;

  if (pathname.includes('/sign-in/magic-link')) {
    return handleMagicLink(request);
  } else if (pathname.includes('/logout')) {
    return handleLogout(request);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(request: NextRequest) {
  const pathname = new URL(request.url).pathname;

  if (pathname.includes('/verify')) {
    return handleVerify(request);
  } else if (pathname.includes('/session')) {
    return handleSession(request);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}