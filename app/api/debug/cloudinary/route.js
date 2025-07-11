import { authOptions } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Debug endpoint to check Cloudinary configuration
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins or in development environment
    if (!session || (process.env.NODE_ENV === 'production' && !session.user.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Test Cloudinary connection
    const pingResult = await cloudinary.api.ping();
    
    // Return basic status info (no secrets)
    return NextResponse.json({
      status: 'ok',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      configured: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET
      ),
      publicConfigured: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
      pingResult
    });
  } catch (error) {
    console.error('Cloudinary debug error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'not-set',
      configured: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET
      ),
      publicConfigured: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
    }, { status: 500 });
  }
}
