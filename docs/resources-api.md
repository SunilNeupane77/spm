# Resources API Documentation

This document outlines the API endpoints for managing resources in the academic organization platform.

## Endpoints

### Resources Collection

#### GET /api/resources

Retrieves resources for the current user, including owned, shared, and public resources.

**Query Parameters:**

- `course` - Filter resources by course ID
- `type` - Filter by resource type (document, video, link, book, article, other)
- `subject` - Filter by subject
- `topic` - Filter by topic
- `tag` - Filter by tag
- `isPublic` - Filter by public/private status (true/false)

**Response:**

```json
[
  {
    "_id": "resource-id",
    "title": "Resource Title",
    "description": "Resource description",
    "type": "document",
    "url": "https://example.com/resource",
    "fileUrl": "https://storage.example.com/file.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024,
    "subject": "Mathematics",
    "topic": "Calculus",
    "tags": ["math", "calculus"],
    "course": {
      "_id": "course-id",
      "name": "Advanced Mathematics",
      "code": "MATH101"
    },
    "owner": {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "isPublic": false,
    "sharedWith": [
      {
        "user": {
          "_id": "user-id",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "permission": "view"
      }
    ],
    "createdAt": "2025-07-05T12:00:00.000Z"
  }
]
```

#### POST /api/resources

Creates a new resource.

**Request Body:**

```json
{
  "title": "Resource Title",
  "description": "Resource description",
  "type": "document",
  "url": "https://example.com/resource",
  "fileUrl": "https://storage.example.com/file.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024,
  "subject": "Mathematics",
  "topic": "Calculus",
  "tags": ["math", "calculus"],
  "course": "course-id",
  "isPublic": false
}
```

**Required Fields:**
- `title` - Resource title
- `type` - Resource type (must be one of: document, video, link, book, article, other)
- For link type resources, `url` is also required

**Response:**

```json
{
  "_id": "resource-id",
  "title": "Resource Title",
  "description": "Resource description",
  "type": "document",
  "url": "https://example.com/resource",
  "fileUrl": "https://storage.example.com/file.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024,
  "subject": "Mathematics",
  "topic": "Calculus",
  "tags": ["math", "calculus"],
  "course": "course-id",
  "owner": "user-id",
  "isPublic": false,
  "sharedWith": [],
  "createdAt": "2025-07-05T12:00:00.000Z"
}
```

**Status Codes:**
- `201` - Resource created successfully
- `400` - Validation error
- `401` - Unauthorized (user not authenticated)
- `500` - Server error

### Individual Resources

#### GET /api/resources/[id]

Retrieves a single resource by ID.

**Response:**

```json
{
  "_id": "resource-id",
  "title": "Resource Title",
  "description": "Resource description",
  "type": "document",
  "url": "https://example.com/resource",
  "fileUrl": "https://storage.example.com/file.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024,
  "subject": "Mathematics",
  "topic": "Calculus",
  "tags": ["math", "calculus"],
  "course": {
    "_id": "course-id",
    "name": "Advanced Mathematics",
    "code": "MATH101"
  },
  "owner": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "isPublic": false,
  "sharedWith": [
    {
      "user": {
        "_id": "user-id",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "permission": "view"
    }
  ],
  "createdAt": "2025-07-05T12:00:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (no access to the resource)
- `404` - Resource not found
- `500` - Server error

#### PUT /api/resources/[id]

Updates a resource.

**Request Body:**

```json
{
  "title": "Updated Resource Title",
  "description": "Updated resource description",
  "subject": "Physics",
  "topic": "Mechanics",
  "tags": ["physics", "mechanics"],
  "isPublic": true
}
```

**Response:**

```json
{
  "_id": "resource-id",
  "title": "Updated Resource Title",
  "description": "Updated resource description",
  "type": "document",
  "url": "https://example.com/resource",
  "fileUrl": "https://storage.example.com/file.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024,
  "subject": "Physics",
  "topic": "Mechanics",
  "tags": ["physics", "mechanics"],
  "course": {
    "_id": "course-id",
    "name": "Advanced Mathematics",
    "code": "MATH101"
  },
  "owner": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "isPublic": true,
  "sharedWith": [
    {
      "user": {
        "_id": "user-id",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "permission": "view"
    }
  ],
  "createdAt": "2025-07-05T12:00:00.000Z"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (no edit permission)
- `404` - Resource not found
- `500` - Server error

#### DELETE /api/resources/[id]

Deletes a resource.

**Response:**

```json
{
  "message": "Resource deleted successfully",
  "course": "course-id"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not the owner)
- `404` - Resource not found
- `500` - Server error

### Resource Sharing

#### POST /api/resources/[id]/share

Shares a resource with another user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "permission": "view"
}
```

**Response:**

```json
{
  "message": "Resource shared successfully",
  "sharedWith": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name"
    },
    "permission": "view"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request (missing email or invalid permission)
- `401` - Unauthorized
- `403` - Forbidden (not the owner)
- `404` - Resource or user not found
- `500` - Server error

#### DELETE /api/resources/[id]/share

Removes a user's access to a resource.

**Request Body:**

```json
{
  "userId": "user-id"
}
```

**Response:**

```json
{
  "message": "Resource sharing removed successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not the owner)
- `404` - Resource not found
- `500` - Server error

### Course Resources

#### GET /api/courses/[id]/resources

Get resources for a specific course.

**Query Parameters:**
- `type` - Filter by resource type
- `subject` - Filter by subject
- `topic` - Filter by topic
- `tag` - Filter by tag
- `isPublic` - Filter by public/private status

**Response:**

```json
[
  {
    "_id": "resource-id",
    "title": "Resource Title",
    "description": "Resource description",
    "type": "document",
    "subject": "Mathematics",
    "topic": "Calculus",
    "tags": ["math", "calculus"],
    "course": {
      "_id": "course-id",
      "name": "Advanced Mathematics",
      "code": "MATH101"
    },
    "owner": {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "isPublic": false,
    "createdAt": "2025-07-05T12:00:00.000Z"
  }
]
```

#### POST /api/courses/[id]/resources

Creates a new resource associated with a specific course.

**Request Body:**
Same as POST /api/resources but with the course ID automatically set.

**Response:**
Same as POST /api/resources.

## File Upload

File uploads are handled via a separate endpoint:

#### POST /api/upload

Uploads a file and returns the file URL.

**Request:**
Multipart form data with a `file` field.

**Response:**

```json
{
  "fileUrl": "https://storage.example.com/file.pdf",
  "fileName": "file.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid file
- `401` - Unauthorized
- `500` - Server error

## Error Handling

All API endpoints return appropriate error responses:

```json
{
  "error": "Error message",
  "details": {} // Optional additional error details
}
```
