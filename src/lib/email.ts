interface EmailData {
  to: string
  subject: string
  text?: string
  html?: string
  category?: string
}

interface MailtrapResponse {
  success: boolean
  message_ids?: string[]
  error?: string
}

export class EmailService {
  private apiToken: string
  private host: string
  private fromEmail: string
  private fromName: string

  constructor() {
    this.apiToken = process.env.MAILTRAP_API_TOKEN!
    this.host = process.env.MAILTRAP_HOST!
    this.fromEmail = process.env.MAILTRAP_FROM_EMAIL!
    this.fromName = process.env.MAILTRAP_FROM_NAME!

    if (!this.apiToken || !this.host || !this.fromEmail || !this.fromName) {
      throw new Error('Missing Mailtrap configuration in environment variables')
    }
  }

  async sendEmail(data: EmailData): Promise<MailtrapResponse> {
    try {
      const payload = {
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        to: [{ email: data.to }],
        subject: data.subject,
        text: data.text,
        html: data.html,
        category: data.category || 'System Notification'
      }

      const response = await fetch(`https://${this.host}/api/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Mailtrap API error: ${response.status} ${errorData}`)
      }

      const result = await response.json()
      return {
        success: true,
        message_ids: result.message_ids
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async sendTestEmail(email: string): Promise<MailtrapResponse> {
    return this.sendEmail({
      to: email,
      subject: 'Test Email - ManajemenAset System',
      text: 'Congratulations! Your email configuration is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #187F7E;">Email Configuration Test</h2>
          <p>Congratulations! Your email configuration is working correctly.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">System Information:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Application: ManajemenAset System</li>
              <li>Service: Mailtrap Email</li>
              <li>Time: ${new Date().toLocaleString('id-ID')}</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 12px;">This is an automated test email from ManajemenAset System.</p>
        </div>
      `,
      category: 'Email Test'
    })
  }

  async sendNotificationEmail(email: string, title: string, message: string): Promise<MailtrapResponse> {
    return this.sendEmail({
      to: email,
      subject: `Notification: ${title}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #187F7E;">${title}</h2>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px;">This notification was sent from ManajemenAset System at ${new Date().toLocaleString('id-ID')}.</p>
        </div>
      `,
      category: 'System Notification'
    })
  }

  async sendSecurityAlert(email: string, alertType: string, details: string): Promise<MailtrapResponse> {
    return this.sendEmail({
      to: email,
      subject: `Security Alert: ${alertType}`,
      text: `Security Alert: ${alertType}\n\nDetails: ${details}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin: 0 0 10px 0;">🔒 Security Alert</h2>
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">${alertType}</h3>
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Details:</h4>
            <p style="margin: 0; line-height: 1.6;">${details}</p>
          </div>
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>Action Required:</strong> Please review your account security settings if this activity was not authorized.</p>
          </div>
          <p style="color: #666; font-size: 12px;">This security alert was sent from ManajemenAset System at ${new Date().toLocaleString('id-ID')}.</p>
        </div>
      `,
      category: 'Security Alert'
    })
  }
}

export const emailService = new EmailService()