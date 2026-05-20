import { Resend } from "resend";
import { env } from "~/env";
import { describeAccessReason, type AccessReason } from "./accessControl";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendWelcomeEmailParams {
  to: string;
  firstName?: string;
}

export async function sendWelcomeEmail({ to, firstName }: SendWelcomeEmailParams) {
  if (!resend) {
    console.warn("Resend not configured - skipping welcome email");
    return { success: false, error: "Resend not configured" };
  }

  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const signInUrl = `https://app.u2canboxing.com/sign-in?email=${encodeURIComponent(to)}`;

  try {
    const { data, error } = await resend.emails.send({
      from: "U2CAN Boxing <noreply@u2canboxing.com>",
      to: [to],
      subject: "Welcome to U2CAN Boxing – Let's Get Started",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to U2CAN Boxing</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f3f4f6;">
  <!-- Wrapper -->
  <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; margin: 20px;">
  <!-- Dark Header -->
  <div style="background-color: #111827; padding: 25px 20px; text-align: center;">
    <img src="https://app.u2canboxing.com/logo.png" alt="U2CAN Boxing" width="100" height="100" style="border-radius: 50%; margin-bottom: 15px;">
    <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; font-style: italic; letter-spacing: -0.5px; margin: 0;">WELCOME TO U2CAN</h1>
    <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 14px;">Let's get you started</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px 20px; background-color: #ffffff;">
  <p>${greeting}</p>

  <p>We're excited to have you with us.</p>

  <p>You've just taken a powerful step towards becoming stronger, fitter, and more confident. Whether your goal is fitness, discipline, stress relief, or mastering boxing skills, you're now part of a community that trains with purpose and heart. Show up consistently, trust the process, and the results will come.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <h2 style="color: #1a1a1a;">&#x1F510; How to Log In to the U2CAN Boxing App</h2>

  <ol style="padding-left: 20px;">
    <li style="margin-bottom: 10px;">Click the button below</li>
    <li style="margin-bottom: 10px;">Enter the <strong>OTP (one-time password)</strong> sent to your email</li>
  </ol>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${signInUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">Sign In to U2CAN Boxing</a>
  </div>

  <p>That's it. No passwords to remember.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <h2 style="color: #1a1a1a;">&#x1F4F2; Set Up the App on Your Phone (Recommended)</h2>

  <p>For the best experience, we recommend adding the web app to your home screen.</p>

  <h3 style="color: #333; margin-top: 20px;">For iPhone (iOS)</h3>
  <ol style="padding-left: 20px;">
    <li style="margin-bottom: 8px;">Open <strong>Safari</strong> (important, not Chrome)</li>
    <li style="margin-bottom: 8px;">Go to: <a href="https://app.u2canboxing.com" style="color: #0066cc;">app.u2canboxing.com</a></li>
    <li style="margin-bottom: 8px;">Tap the <strong>Share</strong> icon (square with arrow)</li>
    <li style="margin-bottom: 8px;">Tap <strong>Add to Home Screen</strong></li>
    <li style="margin-bottom: 8px;">Tap <strong>Add</strong></li>
  </ol>
  <p>You'll now have the U2CAN Boxing app on your home screen like a regular app.</p>

  <h3 style="color: #333; margin-top: 20px;">For Android</h3>
  <ol style="padding-left: 20px;">
    <li style="margin-bottom: 8px;">Open <strong>Chrome</strong></li>
    <li style="margin-bottom: 8px;">Go to: <a href="https://app.u2canboxing.com" style="color: #0066cc;">app.u2canboxing.com</a></li>
    <li style="margin-bottom: 8px;">Tap the <strong>3-dot menu</strong> (top right)</li>
    <li style="margin-bottom: 8px;">Tap <strong>Add to Home screen</strong></li>
    <li style="margin-bottom: 8px;">Confirm <strong>Add</strong></li>
  </ol>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

  <p>If you have any issues logging in or setting things up, just reply to this email and we'll help you out.</p>

  <p style="margin-top: 30px;">
    Welcome to the grind.<br>
    Welcome to the journey.<br>
    Welcome to <strong>U2CAN Boxing</strong>.
  </p>

  <p style="margin-top: 20px;">
    See you in training &#x1F94A;<br>
    <strong>Team U2CAN Boxing</strong>
  </p>
  </div>

  <!-- Dark Footer -->
  <div style="background-color: #111827; padding: 20px; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">U2CAN Boxing</p>
  </div>
  </div>
</body>
</html>
      `.trim(),
      text: `
Welcome to U2CAN Boxing!

${greeting}

We're excited to have you with us.

You've just taken a powerful step towards becoming stronger, fitter, and more confident. Whether your goal is fitness, discipline, stress relief, or mastering boxing skills, you're now part of a community that trains with purpose and heart. Show up consistently, trust the process, and the results will come.

---

HOW TO LOG IN TO THE U2CAN BOXING APP

1. Click this link: ${signInUrl}
2. Enter the OTP (one-time password) sent to your email

That's it. No passwords to remember.

---

SET UP THE APP ON YOUR PHONE (RECOMMENDED)

For the best experience, we recommend adding the web app to your home screen.

For iPhone (iOS):
1. Open Safari (important, not Chrome)
2. Go to: app.u2canboxing.com
3. Tap the Share icon (square with arrow)
4. Tap Add to Home Screen
5. Tap Add

You'll now have the U2CAN Boxing app on your home screen like a regular app.

For Android:
1. Open Chrome
2. Go to: app.u2canboxing.com
3. Tap the 3-dot menu (top right)
4. Tap Add to Home screen
5. Confirm Add

---

If you have any issues logging in or setting things up, just reply to this email and we'll help you out.

Welcome to the grind.
Welcome to the journey.
Welcome to U2CAN Boxing.

See you in training!
Team U2CAN Boxing
      `.trim(),
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      return { success: false, error: error.message };
    }

    console.log("Welcome email sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: String(error) };
  }
}

interface SendAccessDeniedEmailParams {
  to: string;
  firstName?: string | null;
  reason: AccessReason;
  deviceName?: string | null;
  occurredAt: Date;
}

export async function sendAccessDeniedEmail({
  to,
  firstName,
  reason,
  deviceName,
  occurredAt,
}: SendAccessDeniedEmailParams) {
  if (!resend) {
    console.warn("Resend not configured - skipping access-denied email");
    return { success: false, error: "Resend not configured" };
  }

  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const reasonText = describeAccessReason(reason);
  const where = deviceName ? ` at ${deviceName}` : "";
  // Format in Singapore time since the gym operates there.
  const when = occurredAt.toLocaleString("en-SG", {
    timeZone: "Asia/Singapore",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const renewUrl = "https://app.u2canboxing.com/account/membership";

  try {
    const { data, error } = await resend.emails.send({
      from: "U2CAN Boxing <noreply@u2canboxing.com>",
      to: [to],
      subject: "Gym access denied — action needed",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gym access denied</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f3f4f6;">
  <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; margin: 20px;">
    <div style="background-color: #111827; padding: 25px 20px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0;">ACCESS DENIED</h1>
      <p style="color: #fca5a5; margin: 10px 0 0 0; font-size: 14px;">${when}${where}</p>
    </div>
    <div style="padding: 30px 20px; background-color: #ffffff;">
      <p>${greeting}</p>
      <p>We blocked an entry attempt with your face at the gym door just now. The reason was:</p>
      <p style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0; color: #991b1b; font-weight: 600;">
        ${reasonText}
      </p>
      <p>To get back in, please check your membership on the U2CAN app:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${renewUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">Manage membership</a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">If you believe this is a mistake, just reply to this email and we'll sort it out.</p>
      <p style="margin-top: 30px;">— Team U2CAN Boxing</p>
    </div>
    <div style="background-color: #111827; padding: 20px; text-align: center;">
      <p style="color: #9ca3af; margin: 0; font-size: 12px;">U2CAN Boxing</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
      text: `
Gym access denied${where} at ${when}

${greeting}

We blocked an entry attempt with your face at the gym door just now.

Reason: ${reasonText}

Manage your membership: ${renewUrl}

If you believe this is a mistake, reply to this email and we'll help.

— Team U2CAN Boxing
      `.trim(),
    });

    if (error) {
      console.error("Failed to send access-denied email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending access-denied email:", error);
    return { success: false, error: String(error) };
  }
}
