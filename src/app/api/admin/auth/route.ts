import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/admin-auth';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export async function POST(request: NextRequest) {
  try {
    console.log('Admin auth request received');
    
    // Handle both JSON and FormData - TODO: pick one format
    let body;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {
        username: formData.get('username') as string,
        password: formData.get('password') as string
      };
    }
    
    console.log('Login attempt for:', body.username);
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const { username, password } = validationResult.data;
    
    if (!process.env.ADMIN_PASSWORD_HASH) {
      console.error('ADMIN_PASSWORD_HASH not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Verify credentials
    const isValid = await AdminAuth.authenticate(username, password);
    
    if (!isValid) {
      // Small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token and set cookie
    const token = await AdminAuth.generateToken(username);
    await AdminAuth.setAuthCookie(token);
    
    console.log('Login successful for:', username);
    
    return NextResponse.json({
      success: true,
      user: {
        username,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await AdminAuth.clearAuthCookie();
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

// Check current auth status
export async function GET() {
  try {
    const user = await AdminAuth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}