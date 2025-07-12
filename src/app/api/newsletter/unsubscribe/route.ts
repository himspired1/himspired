import { NextRequest, NextResponse } from 'next/server';
import { newsletterService } from '@/lib/newsletter';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Unsubscribe from database
    const success = await newsletterService.unsubscribe(email);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email not found in our newsletter list' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'You have been successfully unsubscribed from our newsletter' 
    });

  } catch (error) {
    console.error('Newsletter unsubscribe failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process unsubscribe request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}