import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('himspired');
    const collection = db.collection('contact_messages');
    
    const messages = await collection.find({}).sort({ createdAt: -1 }).toArray();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = {
      total: messages.length,
      unread: messages.filter(msg => !msg.isRead).length,
      replied: messages.filter(msg => msg.replies?.length > 0).length,
      recent: messages.filter(msg => new Date(msg.createdAt) >= yesterday).length,
    };

    return NextResponse.json({ success: true, messages, stats });
  } catch (error) {
    console.error('Get messages failed:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();
    
    // Quick validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    // Simple email check
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('himspired');
    const collection = db.collection('contact_messages');
    
    // Check rate limit - one message per day
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await collection.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: yesterday }
    });

    if (recent) {
      return NextResponse.json(
        { error: 'Only one message per day allowed', rateLimited: true },
        { status: 429 }
      );
    }

    // Create message
    const messageId = `MSG-${Date.now()}`;
    const contactMessage = {
      messageId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: [],
    };

    await collection.insertOne(contactMessage);

    return NextResponse.json({
      success: true,
      messageId,
      message: 'Message sent! We\'ll get back to you soon.',
    });
  } catch (error) {
    console.error('Contact submit failed:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}