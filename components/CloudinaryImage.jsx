'use client';

import { cn } from '@/lib/utils';
import { CldImage } from 'next-cloudinary';
import { useState } from 'react';

/**
 * CloudinaryImage component for displaying optimized images from Cloudinary
 * 
 * @param {string} publicId - Cloudinary public ID
 * @param {number} width - Width of the image
 * @param {number} height - Height of the image
 * @param {string} alt - Alt text for the image
 * @param {object} transformations - Cloudinary transformations
 * @param {string} className - Additional CSS classes
 * @param {object} rest - Additional props
 */
export function CloudinaryImage({
  publicId,
  width = 600,
  height = 400,
  alt = "",
  transformations = {},
  className,
  ...rest
}) {
  const [isLoading, setIsLoading] = useState(true);

  // Default transformations
  const defaultTransformations = {
    quality: 'auto',
    format: 'auto',
    ...transformations
  };

  // Handle cases where publicId is not available
  if (!publicId) {
    return (
      <div 
        className={cn("bg-muted flex items-center justify-center rounded-md", className)}
        style={{ width: `${width}px`, height: `${height}px` }}
        {...rest}
      >
        <span className="text-muted-foreground text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} {...rest}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse rounded-md">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      <CldImage
        src={publicId}
        width={width}
        height={height}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        className={cn(
          "rounded-md object-cover w-full transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        {...defaultTransformations}
      />
    </div>
  );
}

/**
 * CloudinaryResource component for displaying different resource types from Cloudinary
 * 
 * @param {object} resource - Resource object with cloudinary data
 * @param {string} className - Additional CSS classes
 * @param {object} rest - Additional props
 */
export function CloudinaryResource({ resource, className, ...rest }) {
  if (!resource || !resource.cloudinary || !resource.cloudinary.publicId) {
    return (
      <div className={cn("bg-muted flex items-center justify-center rounded-md p-4", className)} {...rest}>
        <span className="text-muted-foreground text-sm">Resource not available</span>
      </div>
    );
  }

  const { publicId, resourceType, format } = resource.cloudinary;
  
  // Handle different resource types
  switch (resourceType) {
    case 'image':
      return (
        <CloudinaryImage
          publicId={publicId}
          alt={resource.title || "Resource image"}
          className={className}
          {...rest}
        />
      );
      
    case 'video':
      return (
        <div className={cn("relative rounded-md overflow-hidden", className)} {...rest}>
          <video
            className="w-full h-full rounded-md"
            controls
            playsInline
            preload="metadata"
            src={resource.fileUrl || `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${publicId}.${format || 'mp4'}`}
            poster={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/q_auto,f_auto/${publicId}.jpg`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
      
    case 'raw':
    case 'auto':
    default:
      // For documents, PDFs, and other files - show a preview or link
      const fileIcon = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'txt': '📄',
        'xls': '📊',
        'xlsx': '📊',
        'ppt': '📊',
        'pptx': '📊',
        'zip': '📦',
        'rar': '📦',
      }[format?.toLowerCase()] || '📁';
      
      const fileUrl = resource.fileUrl || 
        `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}.${format || ''}`;
      
      return (
        <div 
          className={cn(
            "bg-muted rounded-md p-4 flex flex-col items-center justify-center cursor-pointer",
            "hover:bg-muted/80 transition-colors",
            className
          )} 
          onClick={() => window.open(fileUrl, '_blank')}
          {...rest}
        >
          <div className="text-primary text-xl mb-2">
            {fileIcon}
          </div>
          <div className="text-center">
            <p className="font-medium text-sm">{resource.title || "Document"}</p>
            <p className="text-muted-foreground text-xs mt-1">{format?.toUpperCase() || "FILE"}</p>
          </div>
        </div>
      );
  }
}
