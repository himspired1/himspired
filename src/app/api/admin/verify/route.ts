import { NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/admin-auth';

export async function GET() {
  try {
    const user = await AdminAuth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'Not authenticated' 
        },
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
    console.error('Verification error:', error);
    
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Verification failed' 
      },
      { status: 500 }
    );
  }
}