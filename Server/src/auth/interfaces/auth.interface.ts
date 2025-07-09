import { UserRole } from '../enums/user-role.enum';

export interface IUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  fullName?: string;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
  expiresIn: number;
}

export interface IJwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface IPasswordHash {
  hash: string;
  salt?: string;
}

export interface IAuthResult {
  success: boolean;
  user?: IUser;
  message?: string;
  errors?: string[];
}

export interface ITokenPair {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// Service contracts following SOLID principles
export interface IAuthService {
  register(registerData: any): Promise<IAuthResponse>;
  login(loginData: any): Promise<IAuthResponse>;
  validateUser(email: string, password: string): Promise<IUser | null>;
  generateTokens(user: IUser): Promise<ITokenPair>;
  refreshToken(refreshToken: string): Promise<ITokenPair>;
  updateProfile(userId: string, updateData: any): Promise<IUser>;
  changePassword(userId: string, passwordData: any): Promise<boolean>;
  forgotPassword(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
}

export interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean>;
  generateSecureToken(): string;
}

export interface ITokenService {
  generateAccessToken(payload: IJwtPayload): string;
  generateRefreshToken(payload: IJwtPayload): string;
  verifyToken(token: string): Promise<IJwtPayload>;
  decodeToken(token: string): IJwtPayload | null;
} 