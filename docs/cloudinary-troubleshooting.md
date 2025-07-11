# Cloudinary Upload Troubleshooting Guide

This document explains common issues with Cloudinary uploads and how to fix them.

## Common Issues

### 1. File Buffer Handling

The most common issue is with handling file buffers. In Next.js, when you get a file from FormData, you need to properly convert the ArrayBuffer to a Buffer before uploading to Cloudinary.

**Solution:**
```javascript
// Get file from FormData
const file = formData.get('file');
const bytes = await file.arrayBuffer();
const buffer = Buffer.from(bytes);
file.buffer = buffer;
```

### 2. Resource Type Detection

Cloudinary needs the correct resource type for proper handling. Use `auto` for automatic detection, but for better control:

- `image`: For image files (jpg, png, etc.)
- `video`: For video files (mp4, webm, etc.)
- `raw`: For documents and other files

### 3. File Size Limits

Cloudinary has default upload limits:

- Free plan: 10MB per asset
- Paid plans: Configurable, typically up to 100MB

Our application enforces a 20MB limit client-side.

## Testing Uploads

To test if uploads are working correctly:

1. Try uploading a small image file (< 1MB)
2. Check the Cloudinary dashboard to confirm the file was uploaded
3. Verify the resource was created in the database with proper metadata

## Environment Configuration

Make sure these environment variables are set:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## Debugging Tips

If you encounter upload issues:

1. Check browser console for client-side errors
2. Check server logs for detailed error messages
3. Verify file size and type are supported
4. Test with a smaller, simpler file
5. Ensure your Cloudinary account is active
