import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserModel } from '../models/User';

/**
 * Generates a signed JWT that encodes the user identifier and role.
 */
const generateToken = (id: string, role: string) =>
  jwt.sign({ id, role }, config.jwtSecret, { expiresIn: '7d' });

/**
 * Registers a brand new user and returns the minimal profile.
 */
export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const user = new UserModel({ name, email, password, role });
  await user.save();
  const token = generateToken(user.id, user.role);
  res
    .cookie('token', token, { httpOnly: true, sameSite: 'lax' })
    .status(201)
    .json({ user: { _id: user.id, name: user.name, email: user.email, role: user.role } });
};

/**
 * Authenticates a user via email and password, storing the JWT in a HTTP-only cookie.
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = generateToken(user.id, user.role);
  res
    .cookie('token', token, { httpOnly: true, sameSite: 'lax' })
    .json({ user: { _id: user.id, name: user.name, email: user.email, role: user.role } });
};

/**
 * Clears the authentication cookie to destroy the session on the client.
 */
export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('token').status(204).send();
};

/**
 * Reads the JWT from cookies and returns the associated user document.
 */
export const me = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: { _id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
