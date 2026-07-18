import { sendAdminEmail, sendCustomerConfirmation } from '../config/mail.js'
import { inquiryRepository } from '../services/inquiryRepository.js'

/**
 * Handles incoming contact form submissions, uploads attachments, and sends emails
 */
export async function submitContactForm(req, res, next) {
  try {
    const { name, phone, email, service, message } = req.body
    const file = req.file // Populated by multer upload middleware

    console.log(`✉️ Processing incoming inquiry from ${name} for service [${service}]`)

    const attachmentPath = file ? `/uploads/${file.filename}` : null

    // Persist inquiry in DB or JSON file
    await inquiryRepository.create({
      name,
      phone,
      email,
      service,
      message,
      attachment: attachmentPath
    })

    // Trigger emails in parallel to ensure optimal API response times
    const [adminMailResult, customerMailResult] = await Promise.allSettled([
      sendAdminEmail({ name, phone, email, service, message }, file),
      sendCustomerConfirmation({ name, phone, email, service, message })
    ])

    // Log operational failures to console but don't break response if customer mail fails
    if (adminMailResult.status === 'rejected') {
      console.error('🔴 Admin Mail Dispatch Failed:', adminMailResult.reason)
    }
    if (customerMailResult.status === 'rejected') {
      console.error('🔴 Customer Auto-Reply Failed:', customerMailResult.reason)
    }

    return res.status(200).json({
      success: true,
      message: 'Your engineering request was successfully submitted and logged. A verification email has been dispatched.'
    })

  } catch (error) {
    console.error('🔴 Contact Controller Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Operational failure compiling quotation request. Please try again later.'
    })
  }
}

/**
 * Retrieves all contact inquiries
 */
export async function getAllInquiries(req, res) {
  try {
    const inquiries = await inquiryRepository.getAll()
    return res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries
    })
  } catch (error) {
    console.error('🔴 Error fetching inquiries:', error)
    return res.status(500).json({
      success: false,
      message: 'Error fetching inquiries: ' + error.message
    })
  }
}

/**
 * Deletes an inquiry by ID
 */
export async function deleteInquiry(req, res) {
  try {
    const { id } = req.params
    const deleted = await inquiryRepository.delete(id)
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      })
    }
    return res.status(200).json({
      success: true,
      message: 'Inquiry deleted successfully'
    })
  } catch (error) {
    console.error('🔴 Error deleting inquiry:', error)
    return res.status(500).json({
      success: false,
      message: 'Error deleting inquiry: ' + error.message
    })
  }
}

