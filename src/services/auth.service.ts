import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { userModel, User, CreateUserData } from '../models/user.model';
import { logger } from '../utils/logger';

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async signup(data: SignupData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await userModel.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const userData: CreateUserData = {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      provider: 'email',
    };

    const user = await userModel.create(userData);

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    // Find user by email
    const user = await userModel.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await userModel.findById(userId);
    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  generateToken(userId: string): string {
    if (!env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    // @ts-ignore - TypeScript has issues with jsonwebtoken overloads
    return jwt.sign(
      { userId },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  
  async handleGoogleOAuth(user: User): Promise<AuthResponse> {
    const token = this.generateToken(user.id);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }
}

export const authService = new AuthService();

