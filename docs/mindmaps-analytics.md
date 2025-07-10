# Mindmaps & Analytics Documentation

## Overview

This document provides comprehensive information about the Mindmap and Analytics features of our academic organization platform. These features help students visualize concepts, track their academic progress, and gain insights into their course performance.

## Mindmaps

Mindmaps are visual tools for organizing information and making connections between concepts. They help students to brainstorm ideas, understand complex relationships, and structure their knowledge.

### API Endpoints

- `GET /api/mindmaps` - Get all mindmaps for the current user
- `POST /api/mindmaps` - Create a new mindmap
- `GET /api/mindmaps/:id` - Get a specific mindmap by ID
- `PUT /api/mindmaps/:id` - Update a specific mindmap
- `DELETE /api/mindmaps/:id` - Delete a specific mindmap
- `POST /api/mindmaps/:id/share` - Share a mindmap with another user

#### Query Parameters

- `GET /api/mindmaps?course={courseId}` - Filter mindmaps by course

### Data Structure

A Mindmap consists of:
- **Title and description**: Basic information about the mindmap
- **Owner information**: User who created the mindmap
- **Nodes**: Individual concepts or ideas represented as visual elements
  - ID: Unique identifier
  - Type: Type of node (course, task, resource, note, custom)
  - Label: Display text
  - Data: Associated data or references
  - Position: X,Y coordinates
  - Style: Visual styling properties
- **Edges**: Connections between nodes showing relationships
  - ID: Unique identifier
  - Source: Source node ID
  - Target: Target node ID
  - Label: Optional descriptive text
  - Style: Visual styling properties
- **Sharing permissions**: Access control for collaboration
  - User: Referenced user
  - Permission level: view or edit

### Components

- **MindmapsPage** (`/app/mindmaps/page.jsx`)
  - Lists all mindmaps
  - Filtering capabilities
  - Creation functionality through dialog
  - Card-based display with metadata

- **MindmapDetail** (`/app/mindmaps/[id]/page.jsx`)
  - Detailed view with ReactFlow visualization
  - Node and edge manipulation
  - Collaboration features
  - Save and share functionality
  - Minimap and controls for navigation

## Analytics

Analytics provide insights into academic performance and task management, helping students track progress, identify areas for improvement, and make data-driven decisions about their study habits.

### API Endpoints

- `GET /api/analytics/summary` - Get an overall summary of user activity
  - Returns counts of courses, tasks, mindmaps, resources
  - Most active course
  - Task completion rate
  - Recent activity summary
  
- `GET /api/analytics/courses` - Get analytics data for courses
  - Task distribution by course
  - Completion rates per course
  - Average completion time
  - Workload distribution
  
- `GET /api/analytics/tasks?period={period}` - Get task analytics data with period filtering
  - Period options: week, month, year
  - Task completion trends over time
  - Distribution by type, priority, and status
  - Overdue task analysis

### Data Visualizations

The following charts and visualizations are implemented using Recharts:

1. **Task Completion Trend** (Line Chart)
   - Tracks completed vs. created tasks over time
   - Helps identify productivity patterns
   
2. **Task Type Distribution** (Pie Chart)
   - Visualizes the breakdown of assignments, projects, exams
   - Shows workload composition
   
3. **Task Priority Breakdown** (Bar Chart)
   - Compares high, medium, and low priority tasks
   - Helps with time management decisions
   
4. **Course Performance Overview** (Bar Chart)
   - Shows completion rates alongside task count
   - Multiple axes for different metrics
   
5. **Course Completion Rates** (Progress Bars)
   - Visual indicators of progress per course
   - Color-coded for quick assessment

### Components

- **AnalyticsPage** (`/app/analytics/page.jsx`)
  - Main dashboard with tabbed interface
  - Period selection for filtering data
  - Summary statistics cards
  - Responsive chart layouts
  - Export functionality for reports

## Integration

Both the Mindmap and Analytics features integrate with other parts of the application:

- **Mindmaps can be associated with specific courses**
  - Link mindmaps to course materials
  - Organize study concepts by subject
  - Create course-specific concept maps
  
- **Analytics integrate with tasks and courses**
  - Task completion reflected in course analytics
  - Course performance indicators based on tasks
  - Cross-referenced data for holistic view
  
- **User notifications for analytics insights**
  - Weekly/monthly progress summaries
  - Alerts for potential issues (e.g., many overdue tasks)
  - Congratulatory messages for goal achievement

## Implementation Details

### Mindmaps Technical Stack

- **Frontend**: React with Next.js
- **Visualization**: ReactFlow for node-based diagrams
  - Custom node types
  - Interactive elements
  - Drag-and-drop functionality
  - Zoom and pan controls
  
- **Data Management**: 
  - MongoDB for storage
  - TanStack Query for data fetching
  - Optimistic updates for smooth UX

### Analytics Technical Stack

- **Data Processing**:
  - Aggregation pipelines in MongoDB
  - Date-fns for time-based calculations
  - Server-side data preparation

- **Visualization**:
  - Recharts for responsive, interactive charts
  - Tailwind CSS for styling and layout
  - Dynamic updates based on filters

## Future Enhancements

1. **Mindmaps**:
   - Real-time collaboration using WebSockets
   - AI-assisted concept relationship suggestions
   - Template library for common study patterns
   - Export to PDF/Image

2. **Analytics**:
   - Predictive analytics for course outcomes
   - Study habit recommendations
   - Historical trend comparison
   - Peer anonymized comparisons (opt-in)
   - Custom dashboard creation
- Analytics pull data from tasks, courses, and other activities
- Users can share mindmaps with collaborators

## Testing

Tests for these features can be run with:
```
npm run test
```

For specific test files:
```
npm run test -- __tests__/api/mindmaps/mindmaps.test.js
npm run test -- __tests__/api/analytics/analytics.test.js
```
