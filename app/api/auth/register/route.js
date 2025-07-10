import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// POST /api/auth/register - Register a new user
export async function POST(request) {
  try {
    await dbConnect();
    
    const { name, email, password, role = 'student' } = await request.json();
    
    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpire = new Date();
    verificationExpire.setHours(verificationExpire.getHours() + 24); // 24 hours from now
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      verificationToken,
      verificationExpire,
      isVerified: false
    });
    
    // Send verification email
    if (process.env.EMAIL_SERVER_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        secure: process.env.EMAIL_SERVER_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      });
      
      const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${verificationToken}`;
      
      await transporter.sendMail({
        from: `"Academic Organizer" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Verify your email address',
        text: `Welcome to Academic Organizer! Please verify your email by clicking this link: ${verificationUrl}`,
        html: `
          <div>
            <h2>Welcome to Academic Organizer!</h2>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>If the button doesn't work, you can also click this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
          </div>
        `
      });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Failed to register user:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
