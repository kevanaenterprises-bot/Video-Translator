import { blink } from '@/blink/client'

const NOTIFY_EMAIL_KEY = 'agency_notify_email'

export function getNotifyEmail(): string {
  return localStorage.getItem(NOTIFY_EMAIL_KEY) || ''
}

export function setNotifyEmail(email: string) {
  localStorage.setItem(NOTIFY_EMAIL_KEY, email)
}

interface LeadStatusEmailOptions {
  businessName: string
  oldStatus: string
  newStatus: string
  phone?: string
  category?: string
  toEmail: string
}

export async function sendStatusChangeEmail(opts: LeadStatusEmailOptions): Promise<boolean> {
  if (!opts.toEmail) return false

  const isPositive = opts.newStatus.includes('Interested') || opts.newStatus.includes('Closed')
  const subjectEmoji = isPositive ? '🎯' : '📋'

  try {
    await blink.notifications.email({
      to: opts.toEmail,
      subject: `${subjectEmoji} Lead Update: ${opts.businessName} → ${opts.newStatus}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8FAFC; padding: 24px; border-radius: 12px;">
          <div style="background: #5048E5; padding: 20px 24px; border-radius: 8px 8px 0 0; margin-bottom: 0;">
            <p style="color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 4px;">AgencyGenius AI Pipeline</p>
            <h1 style="color: #fff; font-size: 22px; font-weight: 700; margin: 0;">Lead Status Updated</h1>
          </div>
          <div style="background: #fff; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #E2E8F0; border-top: none;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #64748B; font-size: 13px; width: 140px;">Business</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 600; color: #0F172A;">${opts.businessName}</td>
              </tr>
              ${opts.category ? `<tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #64748B; font-size: 13px;">Category</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #334155;">${opts.category}</td>
              </tr>` : ''}
              ${opts.phone ? `<tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #64748B; font-size: 13px;">Phone</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #334155;">${opts.phone}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #64748B; font-size: 13px;">Previous Status</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #64748B;">${opts.oldStatus}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748B; font-size: 13px;">New Status</td>
                <td style="padding: 10px 0;">
                  <span style="display: inline-block; background: ${isPositive ? '#ECFDF5' : '#F8FAFC'}; color: ${isPositive ? '#065F46' : '#334155'}; border: 1px solid ${isPositive ? '#6EE7B7' : '#E2E8F0'}; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700;">
                    ${opts.newStatus}
                  </span>
                </td>
              </tr>
            </table>
            ${isPositive ? `
            <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
              <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">🎉 Hot lead! Follow up within the hour to maximize close rate.</p>
            </div>` : ''}
            <p style="color: #94A3B8; font-size: 12px; margin: 0; text-align: center;">AgencyGenius AI Pipeline · Frisco, TX Lead Operations</p>
          </div>
        </div>
      `,
      text: `Lead Update: ${opts.businessName}\n\nStatus changed from "${opts.oldStatus}" to "${opts.newStatus}"\nPhone: ${opts.phone || 'N/A'}\nCategory: ${opts.category || 'N/A'}\n\n${isPositive ? '🎉 Hot lead! Follow up within the hour.' : ''}\n\n— AgencyGenius AI Pipeline`,
    })
    return true
  } catch {
    return false
  }
}
