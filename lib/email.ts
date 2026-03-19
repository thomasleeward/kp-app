import { Resend } from 'resend'

// Use a verified domain in production — resend.dev works for testing
const FROM = 'KP Discipleship <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function sendStepCompleteEmail(
  toEmail: string,
  memberName: string,
  stepName: string,
  staffName: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Your progress has been updated',
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
        <div style="width:36px;height:36px;background:#2563eb;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:28px;">
          <span style="color:white;font-weight:700;font-size:13px;">KP</span>
        </div>
        <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Great progress!</h1>
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
          Hi ${memberName},<br/><br/>
          <strong>${staffName}</strong> has marked <strong>"${stepName}"</strong> as complete on your discipleship journey. Keep going — you're making great progress!
        </p>
        <a href="${APP_URL}/dashboard"
           style="display:inline-block;background:#2563eb;color:white;font-weight:600;font-size:14px;padding:13px 26px;border-radius:10px;text-decoration:none;">
          View your progress →
        </a>
        <p style="font-size:12px;color:#9ca3af;margin-top:40px;border-top:1px solid #f3f4f6;padding-top:20px;">
          King's Park Church · <a href="${APP_URL}/dashboard" style="color:#9ca3af;">Dashboard</a>
        </p>
      </div>
    `,
  })
}

export async function sendLeadershipUnlockedEmail(
  toEmail: string,
  memberName: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Your Leadership Track is now open!",
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:8px;margin-bottom:28px;"></div>
        <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Your leadership journey starts now!</h1>
        <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
          Hi ${memberName},<br/><br/>
          Exciting news — your leadership track at King's Park has been unlocked! Log in to see your path forward and the steps ahead of you.
        </p>
        <a href="${APP_URL}/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:white;font-weight:600;font-size:14px;padding:13px 26px;border-radius:10px;text-decoration:none;">
          View my Leadership Track →
        </a>
        <p style="font-size:12px;color:#9ca3af;margin-top:40px;border-top:1px solid #f3f4f6;padding-top:20px;">
          King's Park Church · <a href="${APP_URL}/dashboard" style="color:#9ca3af;">Dashboard</a>
        </p>
      </div>
    `,
  })
}
