import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload response
 */
export async function uploadToCloudinary(file, options = {}) {
  try {
    // For Next.js File API compatibility
    if (!file.buffer) {
      console.error("File buffer not provided");
      throw new Error("File buffer not provided");
    }

    // Handle different buffer types
    let buffer = file.buffer;
    
    // If it's an ArrayBuffer, convert it to Buffer
    if (file.buffer instanceof ArrayBuffer) {
      buffer = Buffer.from(file.buffer);
    } 
    // If it's already a Buffer, use as is
    else if (Buffer.isBuffer(file.buffer)) {
      buffer = file.buffer;
    }
    // If neither, try to get the buffer from the file
    else if (file.arrayBuffer) {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      throw new Error("Invalid buffer format");
    }

    // Construct data URI with correct MIME type
    const dataUri = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    
    // Use direct upload instead of stream for better compatibility
    const uploadResponse = await cloudinary.uploader.upload(
      dataUri,
      {
        folder: 'academic-resources',
        resource_type: 'auto',
        ...options
      }
    );

    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      format: uploadResponse.format,
      width: uploadResponse.width,
      height: uploadResponse.height,
      resourceType: uploadResponse.resource_type,
      bytes: uploadResponse.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Provide more detailed error messages
    if (error.message.includes('buffer')) {
      throw new Error(`File buffer processing error: ${error.message}`);
    } else if (error.message.includes('network')) {
      throw new Error(`Network error during upload: ${error.message}`);
    } else if (error.http_code) {
      throw new Error(`Cloudinary API error (${error.http_code}): ${error.message}`);
    } else {
      throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
  }
}

/**
 * Delete a file from Cloudinary
 * @param {String} publicId - The public ID of the resource to delete
 * @returns {Promise<Object>} - Cloudinary delete response
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
}

export default cloudinary;
