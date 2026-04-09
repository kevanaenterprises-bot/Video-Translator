interface WelcomeEmailParams {
  toEmail: string;
  toName: string;
  username: string;
  password: string;
  appUrl: string;
}

export async function sendWelcomeEmail({
  toEmail,
  toName,
  username,
  password,
  appUrl,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "SpeakEasy <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("⚠️ RESEND_API_KEY not set — skipping welcome email");
    return { success: false, error: "Email service not configured" };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body style="margin:0; padding:0; background:#f4f4f5; font-family: 'Inter', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0a0c10 0%, #161b26 100%); padding: 36px 40px; text-align:center;">
                  <div style="font-size:48px; margin-bottom:12px;">🐢</div>
                  <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:900; letter-spacing:-0.5px;">SpeakEasy</h1>
                  <p style="color:#00c896; margin:6px 0 0; font-size:14px; font-weight:500;">Your account is ready</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 36px 40px;">
                  <p style="color:#374151; font-size:16px; margin:0 0 8px;">Hi <strong>${toName}</strong>,</p>
                  <p style="color:#6b7280; font-size:15px; line-height:1.6; margin:0 0 28px;">
                    Your SpeakEasy account has been created. Sign in below to start making video calls with live translation in 14 languages.
                  </p>

                  <!-- Credentials box -->
                  <table width="100%" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; margin-bottom:28px;">
                    <tr>
                      <td style="padding:24px 28px;">
                        <p style="color:#6b7280; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin:0 0 16px;">Your Login Credentials</p>
                        <table width="100%">
                          <tr>
                            <td style="padding:6px 0;">
                              <span style="color:#9ca3af; font-size:13px;">Username</span><br/>
                              <strong style="color:#111827; font-size:16px; font-family: monospace;">${username}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0; border-top:1px solid #e5e7eb;">
                              <span style="color:#9ca3af; font-size:13px;">Password</span><br/>
                              <strong style="color:#111827; font-size:16px; font-family: monospace;">${password}</strong>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%">
                    <tr>
                      <td align="center">
                        <a href="${appUrl}" style="display:inline-block; background:#00c896; color:#000000; font-weight:700; font-size:16px; padding:14px 36px; border-radius:10px; text-decoration:none;">
                          Sign In to SpeakEasy →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color:#9ca3af; font-size:13px; text-align:center; margin:24px 0 0; line-height:1.6;">
                    We recommend changing your password after your first sign-in.<br/>
                    If you didn't expect this email, please disregard it.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb; border-top:1px solid #e5e7eb; padding:20px 40px; text-align:center;">
                  <p style="color:#9ca3af; font-size:12px; margin:0;">
                    SpeakEasy · Powered by <strong>Turtle Logistics LLC</strong> 🐢
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Your SpeakEasy account is ready 🐢`,
        html,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("❌ Resend error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    console.log(`✅ Welcome email sent to ${toEmail}`);
    return { success: true };
  } catch (err: any) {
    console.error("❌ Email send error:", err);
    return { success: false, error: err.message };
  }
}
