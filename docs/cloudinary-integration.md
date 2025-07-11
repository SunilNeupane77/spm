# Cloudinary Integration for Resource Management

This document outlines how Cloudinary is integrated into our Academic Organization Platform for resource management.

## Overview

Cloudinary provides a complete cloud-based image and video management solution. It's used in our platform to store, optimize, and deliver various types of resources like documents, images, videos, and other file types.

## Environment Configuration

The following environment variables must be set in `.env.local`:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## Resource Model

The Resource model has been extended to include Cloudinary-specific information:

```javascript
cloudinary: {
  publicId: {
    type: String,
    required: false
  },
  resourceType: {
    type: String,
    required: false
  },
  format: {
    type: String,
    required: false
  }
}
```

## API Endpoints

### Upload API

The upload API (`/api/upload`) has been enhanced to upload files to Cloudinary:

1. Files are uploaded to the `academic-resources/{userId}` folder
2. Files are automatically categorized by resource type
3. Metadata like user ID and course ID are stored in the Cloudinary context
4. The response includes important Cloudinary data like publicId, URL, and format

### Delete API

When a resource is deleted, the associated Cloudinary file is also deleted:

1. The resource's `cloudinary.publicId` is used to identify the file
2. `cloudinary.resourceType` is used to correctly specify the resource type for deletion
3. If Cloudinary deletion fails, the resource is still deleted from the database with an error logged

## Frontend Components

### CloudinaryImage Component

A custom React component that leverages the `next-cloudinary` package:

```jsx
<CloudinaryImage 
  publicId="sample" 
  width={600} 
  height={400} 
  alt="Sample Image" 
  transformations={{ quality: "auto", format: "auto" }} 
/>
```

### CloudinaryResource Component

This component intelligently displays different types of resources:

1. Images are displayed using optimized Cloudinary image delivery
2. Videos are displayed with video controls and a generated thumbnail
3. Documents and other files show a type-specific icon with download options

## Usage Examples

### Displaying a Resource

```jsx
<CloudinaryResource 
  resource={resource} 
  width={800} 
  height={400} 
  className="w-full rounded-md"
/>
```

### Uploading a File

```jsx
const formData = new FormData();
formData.append('file', selectedFile);

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const uploadData = await uploadResponse.json();

// Create resource with Cloudinary data
const resourceData = {
  // ...other resource fields
  fileUrl: uploadData.url,
  cloudinary: {
    publicId: uploadData.publicId,
    resourceType: uploadData.resourceType,
    format: uploadData.format
  }
};
```

## Benefits

1. **Optimized Delivery**: Cloudinary automatically optimizes images and videos for fast loading
2. **Responsive Images**: Automatically adjusts quality and format based on the user's device
3. **Transformations**: Can apply transformations like resize, crop, and filters on-the-fly
4. **Backup & Recovery**: Files are stored securely in the cloud with redundancy
5. **Cost-Effective**: Free tier available for smaller applications

## Future Enhancements

1. Implement on-the-fly image transformations for optimized thumbnails
2. Add support for Cloudinary video player with advanced features
3. Implement secure signed URLs for protected resources
4. Add automatic tagging and AI-based categorization of resources
