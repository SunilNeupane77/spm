# Courses & Resources Documentation

## Overview

This document provides comprehensive information about the Courses and Resources features of our academic organization platform. These features help students manage their courses, track course materials, and organize educational resources.

## Courses

Courses are the foundation of the academic organization system, representing individual classes that students are taking or have taken.

### API Endpoints

#### Course Management

- `GET /api/courses` - Get all courses for the current user
  - Query parameters:
    - `year`: Filter by academic year
    - `semester`: Filter by semester (Fall, Spring, etc.)

- `POST /api/courses` - Create a new course
- `GET /api/courses/:id` - Get a specific course by ID
- `PUT /api/courses/:id` - Update a specific course
- `DELETE /api/courses/:id` - Delete a specific course

#### Course Sharing

- `POST /api/courses/:id/share` - Share a course with another user
  - Body parameters:
    - `email`: Email of the user to share with
    - `permission`: Permission level ("view" or "edit")

### Data Structure

A Course consists of:

- **Basic Information**:
  - Name: The course title
  - Code: The course code (e.g., "CS101")
  - Description: A description of the course content
  - Color: Visual identifier for the course

- **Academic Details**:
  - Instructor: The course teacher or professor
  - Semester: When the course is offered (Fall, Spring, Summer, Winter)
  - Year: Academic year

- **Ownership & Sharing**:
  - Owner: The user who created the course
  - Shared users: Other users with access to the course
  - Permission levels: View or edit

### Components

- **CoursesPage** (`/app/courses/page.jsx`)
  - Lists all courses
  - Filtering by year and semester
  - Creation functionality through dialog
  - Card-based display with metadata

- **CourseDetailPage** (`/app/courses/[id]/page.jsx`)
  - Detailed view with tabbed interface
  - Course information overview
  - Associated tasks list
  - Progress tracking
  - Resource management

- **CourseEditPage** (`/app/courses/[id]/edit/page.jsx`)
  - Form for editing course details
  - Color selection
  - Academic information updates

## Resources

Resources are course materials and educational content associated with courses.

### API Endpoints

- `GET /api/resources` - Get all resources for the current user
  - Query parameters:
    - `course`: Filter by course ID
    - `type`: Filter by resource type

- `POST /api/resources` - Create a new resource
- `GET /api/resources/:id` - Get a specific resource by ID
- `PUT /api/resources/:id` - Update a specific resource
- `DELETE /api/resources/:id` - Delete a specific resource

### Data Structure

A Resource consists of:

- **Content Information**:
  - Title: Name of the resource
  - Description: Brief description of the content
  - Type: Category (document, video, link, book, article, other)
  - URL: Web address or file location
  - File metadata: Type, size, etc. for uploaded files

- **Organization**:
  - Course: Associated course
  - Subject & Topic: For more detailed categorization
  - Tags: Keywords for easy searching and filtering

- **Ownership & Access**:
  - Owner: Creator of the resource
  - Public flag: Whether the resource is publicly accessible
  - Shared users: Other users with access to the resource

### Components

- **ResourcesPage** (`/app/courses/[id]/resources/page.jsx`)
  - Lists all resources for a course
  - Filtering by resource type
  - Card-based display with type indicators
  - Upload and link addition functionality

- **NewResourcePage** (`/app/courses/[id]/resources/new/page.jsx`)
  - Form for adding new resources
  - File upload functionality
  - Link addition options
  - Resource type selection

## Integration

Courses and Resources are integrated with other parts of the application:

- **Tasks are associated with courses**
  - Tasks can be filtered by course
  - Course progress is calculated from task completion

- **Resources are organized by course**
  - Resources can be accessed from course details
  - Course materials are centralized

- **Analytics track course performance**
  - Completion rates by course
  - Resource usage statistics

## Implementation Details

### Technical Stack

- **Frontend**:
  - React with Next.js
  - TanStack Query for data fetching
  - Dialog components for creation/editing
  - Card components for display

- **Backend**:
  - RESTful API endpoints
  - MongoDB for data storage
  - Authentication with NextAuth.js
  - Permission checking middleware

### Data Management

- **Course data** is stored in MongoDB with references to:
  - User accounts (owner and shared users)
  - Associated tasks
  - Resources

- **Resource data** includes:
  - Metadata for various types of content
  - File storage integration
  - Access control information

## Future Enhancements

1. **Courses**:
   - Calendar integration for class schedules
   - Grading system integration
   - Course syllabus management
   - Attendance tracking

2. **Resources**:
   - Full-text search capabilities
   - AI-powered content summarization
   - Content recommendation based on course progress
   - Collaborative annotation tools
   - Version history for uploaded files
