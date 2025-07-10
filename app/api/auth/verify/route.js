import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// POST /api/auth/verify - Verify a user's email
export async function POST(request) {
  try {
    await dbConnect();
    
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    // Find user with this verification token
    const user = await User.findOne({ 
      verificationToken: token,
      verificationExpire: { $gt: new Date() } // Token must not be expired
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    
    // Mark user as verified and remove token
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    
    await user.save();
    
    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Failed to verify email:', error);
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
  }
}
