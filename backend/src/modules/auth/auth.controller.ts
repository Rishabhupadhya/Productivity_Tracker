import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { registerUser, loginUser } from "./auth.service";

// Cookie options for secure token storage
const getCookieOptions = () => ({
  httpOnly: true, // Prevents JavaScript access
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const, // CSRF protection
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
});

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
    
    // Set HttpOnly cookies instead of sending tokens in response
    res.cookie('accessToken', result.token, {
      ...getCookieOptions(),
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', result.token, {
      ...getCookieOptions(),
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      user: result.user
      // NOTE: Tokens NOT sent in response body (security improvement)
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
    
    // Set HttpOnly cookies instead of sending tokens in response
    res.cookie('accessToken', result.token, {
      ...getCookieOptions(),
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', result.token, {
      ...getCookieOptions(),
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      user: result.user
      // NOTE: Tokens NOT sent in response body (security improvement)
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
  // Clear authentication cookies
  res.clearCookie('accessToken', getCookieOptions());
  res.clearCookie('refreshToken', getCookieOptions());
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
