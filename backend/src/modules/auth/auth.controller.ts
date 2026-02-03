import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "./auth.service";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser(name, email, password);
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
    const { email, password } = req.body;
    const result = await loginUser(email, password);
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
    next(error);
  }
};
