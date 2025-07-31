import { body } from 'express-validator';

export const productValidationRules = [
    body('brand').trim().not().isEmpty().withMessage('Brand is required.'),
    body('model').trim().not().isEmpty().withMessage('Model is required.'),
    body('marketPrice').isFloat({ min: 0 }).withMessage('Market Price must be a positive number.'),
    body('ourPrice').isFloat({ min: 0 }).withMessage('Our Price must be a positive number.'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a whole number (0 or more).'),
    body('description').trim().not().isEmpty().withMessage('Description is required.'),
    body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Image URL must be a valid URL.'),
];