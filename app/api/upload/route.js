import { authOptions } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Maximum file size (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

// Cloudinary file upload handler
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the formData
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Get additional metadata from formData
    const title = formData.get('title') || file.name;
    const courseId = formData.get('courseId') || null;
    
    // Check file size (limit to MAX_FILE_SIZE)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File size exceeds limit',
        details: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      }, { status: 400 });
    }
    
    // Check if file type is supported
    const supportedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    
    if (!supportedTypes.includes(file.type) && process.env.NODE_ENV === 'production') {
      console.warn(`Potentially unsupported file type: ${file.type}`);
    }
    
    // Get file details
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Prepare file object for Cloudinary
    file.buffer = buffer;
    
    // Upload to Cloudinary with folder based on user ID
    const folderPath = `academic-resources/${session.user.id}`;
    
    // Determine resource type from file for better handling
    let resourceType = 'auto';
    if (file.type.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.type.startsWith('video/')) {
      resourceType = 'video';
    } else if (file.type === 'application/pdf' || 
              file.type.includes('document') || 
              file.type.includes('text/')) {
      resourceType = 'raw';
    }
    
    // Upload the file to Cloudinary
    const cloudinaryResponse = await uploadToCloudinary(file, {
      folder: folderPath,
      filename_override: file.name,
      resource_type: resourceType,
      tags: ['academic', 'resource'],
      // Provide context metadata
      context: {
        user_id: session.user.id,
        course_id: courseId || '',
        original_filename: file.name,
        file_type: file.type
      }
    });
    
    return NextResponse.json({ 
      success: true,
      url: cloudinaryResponse.url,
      publicId: cloudinaryResponse.publicId,
      resourceType: cloudinaryResponse.resourceType,
      format: cloudinaryResponse.format,
      fileName: file.name,
      fileType: file.type,
      fileSize: buffer.length,
      title,
      courseId
    });
  } catch (error) {
    // Detailed error logging
    console.error('Error uploading file:', error);
    console.error('Error stack:', error.stack);
    
    if (error.http_code) {
      console.error('Cloudinary HTTP error:', error.http_code);
    }
    
    // Check for Cloudinary specific errors
    if (error.http_code === 401 || error.http_code === 403) {
      return NextResponse.json({ 
        error: 'Cloudinary authentication error', 
        details: 'Invalid API credentials. Please check Cloudinary configuration.' 
      }, { status: 500 });
    } else if (error.http_code === 413 || error.message.includes('size')) {
      return NextResponse.json({ 
        error: 'File size error', 
        details: 'File exceeds Cloudinary upload limits' 
      }, { status: 400 });
    } else if (error.message.includes('buffer')) {
      return NextResponse.json({ 
        error: 'File processing error', 
        details: 'Failed to process the file buffer' 
      }, { status: 500 });
    } else if (error.message.includes('Cloudinary') || error.message.includes('upload')) {
      return NextResponse.json({ 
        error: 'Cloudinary upload failed', 
        details: error.message 
      }, { status: 500 });
    }
    
    // Generic error fallback
    return NextResponse.json({ 
      error: 'Error uploading file',
      details: error.message || 'Unknown error occurred during upload'
    }, { status: 500 });
  }
}
