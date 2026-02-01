import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "./auth.service";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const token = await registerUser(name, email, password);
    res.status(201).json({ token });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const token = await loginUser(email, password);
    res.json({ token });
  } catch (error) {
    next(error);
  }
};
