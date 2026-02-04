import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { registerUser, loginUser, requestPasswordReset, resetPassword } from "./auth.service";
import { sendPasswordResetEmail } from "../../services/email.service";

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
];

export const requestReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const { user, token } = await requestPasswordReset(email);

    // Send the actual email
    await sendPasswordResetEmail(user, token);

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.'
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      // Security best practice: don't reveal if user exists
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a reset token has been generated.'
      });
    }
    next(error);
  }
};

export const reset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, password } = req.body;
    await resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Cookie options for secure token storage
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Prevents JavaScript access
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? ('none' as const) : ('lax' as const), // none for cross-domain in prod
    path: '/',
    maxAge: undefined // Let expiry be controlled by separate maxAge parameter
    // Don't set domain - let browser handle it automatically
  };
};

// Input validation middleware
export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .escape(), // Sanitize HTML
  body('email')
    .trim()
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
];

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;
    const result = await registerUser(name, email, password);

    // Return tokens in response for localStorage (cross-domain compatible)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    if (error.message === 'User already exists') {
      return res.status(409).json({
        success: false,
        message: 'Account already exists. Please login.'
      });
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const result = await loginUser(email, password);

    // Return tokens in response for localStorage (cross-domain compatible)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'No account found. Please register first.'
      });
    }
    if (error.message === 'Invalid credentials' || error.message.includes('OAuth')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('Account locked')) {
      return res.status(423).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  // Client will clear localStorage
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
