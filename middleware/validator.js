import { body, validationResult } from 'express-validator'

export const contactValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name field is required.')
    .isLength({ max: 80 }).withMessage('Name exceeds 80 characters limit.'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Mobile line is required.')
    .matches(/^[6-9]\d{9}$/).withMessage('Please specify a valid 10-digit Indian telephone line.'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please specify a valid email format.')
    .normalizeEmail(),
  
  body('service')
    .trim()
    .notEmpty().withMessage('Please specify a service stream category.'),
  
  body('message')
    .trim()
    .notEmpty().withMessage('Please describe project requirements.')
    .isLength({ min: 10 }).withMessage('Requirements description must be at least 10 characters long.')
]

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }
  
  // Format errors array as response
  return res.status(400).json({
    success: false,
    errors: errors.array()
  })
}
