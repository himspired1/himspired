import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this');

export interface AdminUser {
  sub: string;
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

export class AdminAuth {
  static async hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  static async generateToken(username: string) {
    return new SignJWT({
      sub: username,
      role: 'admin',
      username
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
  }

  static async verifyToken(token: string): Promise<AdminUser | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      if (
        typeof payload.sub === 'string' &&
        typeof payload.username === 'string' &&
        payload.role === 'admin'
      ) {
        return {
          sub: payload.sub,
          username: payload.username,
          role: payload.role,
          iat: payload.iat,
          exp: payload.exp
        };
      }
      
      return null;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  static async authenticate(username: string, password: string) {
    console.log('Auth attempt for:', username);
    
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash) {
      console.error('ADMIN_PASSWORD_HASH not configured');
      return false;
    }

    // Only allow 'admin' username for now
    if (username !== 'admin') {
      console.log('Invalid username:', username);
      return false;
    }

    try {
      const result = await this.verifyPassword(password, passwordHash);
      console.log('Password verification:', result ? 'success' : 'failed');
      return result;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  static async setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });
  }

  static async getAuthCookie() {
    const cookieStore = await cookies();
    return cookieStore.get('admin-token')?.value || null;
  }

  static async clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('admin-token');
  }

  static async getCurrentUser() {
    const token = await this.getAuthCookie();
    if (!token) return null;
    
    return this.verifyToken(token);
  }

  static async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // For middleware
  static async isAuthenticatedFromRequest(request: NextRequest) {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) return false;
    
    const user = await this.verifyToken(token);
    return user !== null;
  }

  static async getUserFromRequest(request: NextRequest) {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) return null;
    
    return this.verifyToken(token);
  }
}

// Helper for setup
export async function generatePasswordHash(password: string) {
  return AdminAuth.hashPassword(password);
}

// TODO: Remove this debug function before production
export async function verifyAuthSetup() {
  return {
    hasSecret: !!process.env.JWT_SECRET,
    hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
    secretLength: process.env.JWT_SECRET?.length || 0
  };
}