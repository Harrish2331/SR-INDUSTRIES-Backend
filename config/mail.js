import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

let transporter

// Check if production or local SMTP configurations are defined
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
} else {
  // Development Mock Transporter
  console.warn('⚠️ SMTP settings not found. Nodemailer active in console-logger mock mode.')
  transporter = {
    sendMail: async (options) => {
      console.log('📬 [SMTP MOCK MESSAGE DISPATCH]')
      console.log(`To: ${options.to}`)
      console.log(`Subject: ${options.subject}`)
      console.log(`Body-Preview: ${options.text.substring(0, 150)}...`)
      if (options.attachments && options.attachments.length > 0) {
        console.log(`Attachments Registered: ${options.attachments.map(a => a.filename).join(', ')}`)
      }
      console.log('--------------------------------')
      return { messageId: 'mock-message-id-xyz123' }
    }
  }
}

/**
 * Sends detailed project specs to Owner (rengraj19@gmail.com)
 */
export async function sendAdminEmail({ name, email, phone, service, message }, file) {
  const adminAddress = process.env.ADMIN_EMAIL || 'rengraj19@gmail.com'
  
  const mailOptions = {
    from: `"S R Industries Portal" <${process.env.SMTP_USER || 'no-reply@srindustries.in'}>`,
    to: adminAddress,
    subject: `[New Inquiry] ${service} - from ${name}`,
    text: `New engineering request received.\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nService Stream: ${service}\nMessage: ${message}`,
    html: `
      <div style="background-color: #0b0b0b; color: #ffffff; font-family: sans-serif; padding: 30px; border: 1px solid #D4AF37; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #D4AF37; font-size: 20px; border-bottom: 1px solid #1c1c1c; padding-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">
          S R Industries - Engineering Desk
        </h2>
        <p style="font-size: 14px; color: #b5b5b5;">A new fabrication quotation request has been lodged from the website portal.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 10px 0; color: #D4AF37; font-weight: bold; width: 150px;">Customer Name:</td>
            <td style="padding: 10px 0; color: #ffffff;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #D4AF37; font-weight: bold;">Mobile Line:</td>
            <td style="padding: 10px 0; color: #ffffff;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #D4AF37; font-weight: bold;">Email Address:</td>
            <td style="padding: 10px 0; color: #ffffff;"><a href="mailto:${email}" style="color: #ffffff; text-decoration: underline;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #D4AF37; font-weight: bold;">Requested Stream:</td>
            <td style="padding: 10px 0; color: #D4AF37; font-weight: bold;">${service}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #D4AF37; font-weight: bold; vertical-align: top;">Project Scope:</td>
            <td style="padding: 10px 0; color: #b5b5b5; line-height: 1.6;">${message}</td>
          </tr>
        </table>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #1c1c1c; font-size: 11px; color: #555555; text-align: center;">
          Received: ${new Date().toLocaleString('en-IN')} &bull; S R Industries API Service
        </div>
      </div>
    `
  }

  // Inject attachment files if uploaded by customer
  if (file) {
    mailOptions.attachments = [
      {
        filename: file.originalname,
        path: file.path
      }
    ]
  }

  return transporter.sendMail(mailOptions)
}

/**
 * Sends a corporate confirmation message back to customer verifying receipt
 */
export async function sendCustomerConfirmation({ name, email, service }) {
  const mailOptions = {
    from: `"S R Industries Support" <${process.env.SMTP_USER || 'no-reply@srindustries.in'}>`,
    to: email,
    subject: `Inquiry Acknowledged - S R Industries`,
    text: `Hello ${name},\nThank you for contacting S R Industries. We have received your inquiry for "${service}" and our engineering head G. Rengaraj will review it shortly.`,
    html: `
      <div style="background-color: #0b0b0b; color: #ffffff; font-family: sans-serif; padding: 40px; border-top: 4px solid #D4AF37; max-width: 600px; margin: 0 auto; border-radius: 4px;">
        <h2 style="font-size: 20px; color: #ffffff; letter-spacing: 1px; font-weight: normal; margin-bottom: 20px;">
          THANK YOU FOR CONTACTING <span style="color: #D4AF37; font-weight: bold;">S R INDUSTRIES</span>
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #b5b5b5;">
          Hello <strong>${name}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #b5b5b5;">
          We have successfully received your inquiry regarding <strong>${service}</strong>. Our engineering lead, <strong>G. Rengaraj</strong>, will study your specifications and follow up with structural estimations, questions, or measurements.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #b5b5b5;">
          If you need to supply updated layout drawings in the meantime, please reply directly to this mail or text our desk via WhatsApp at +91 86102 35094.
        </p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1c1c1c; font-size: 13px;">
          <strong style="color: #ffffff; display: block;">S R Industries</strong>
          <span style="color: #D4AF37; font-size: 11px; text-transform: uppercase; tracking: 1px;">Heavy Structural & Custom Fabrication Excellence</span>
          <span style="color: #555555; display: block; font-size: 11.5px; mt-2;">Chennai HQ | Estd. 2019</span>
        </div>
      </div>
    `
  }

  return transporter.sendMail(mailOptions)
}
