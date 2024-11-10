export interface BaseError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}