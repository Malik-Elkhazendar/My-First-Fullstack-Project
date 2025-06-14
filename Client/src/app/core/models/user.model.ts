export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  token?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  Customer = 'customer',
  Admin = 'admin'
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
} 