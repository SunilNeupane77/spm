import { authOptions } from '@/lib/auth';
import { mkdir, writeFile } from 'fs/promises';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { join } from 'path';

// Simple file upload handler
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
    
    // Get file details
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create unique filename using timestamp and original filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
    
    // Define path to save the file
    const userUploadDir = join(process.cwd(), 'public', 'uploads', session.user.id);
    
    // Make sure the directory exists
    try {
      await mkdir(userUploadDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create upload directory:', err);
    }
    
    const filePath = join(userUploadDir, filename);
    
    // Write the file
    await writeFile(filePath, buffer);
    
    // Create the public URL for the file
    const fileUrl = `/uploads/${session.user.id}/${filename}`;
    
    return NextResponse.json({ 
      success: true,
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: buffer.length,
      title,
      courseId
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
