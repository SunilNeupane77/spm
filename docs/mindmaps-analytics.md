# Mindmaps & Analytics Documentation

## Overview

This document provides information about the Mindmap and Analytics features of our academic organization platform. These features help students visualize concepts and track their academic progress.

## Mindmaps

Mindmaps are visual tools for organizing information and making connections between concepts.

### API Endpoints

- `GET /api/mindmaps` - Get all mindmaps for the current user
- `POST /api/mindmaps` - Create a new mindmap
- `GET /api/mindmaps/:id` - Get a specific mindmap by ID
- `PUT /api/mindmaps/:id` - Update a specific mindmap
- `DELETE /api/mindmaps/:id` - Delete a specific mindmap
- `POST /api/mindmaps/:id/share` - Share a mindmap with another user

### Data Structure

A Mindmap consists of:
- Title and description
- Owner information
- Nodes (concepts, ideas)
- Edges (connections between nodes)
- Sharing permissions

### Components

- `MindmapsPage` - Lists all mindmaps and provides creation functionality
- `MindmapDetail` - Detailed view with ReactFlow visualization

## Analytics

Analytics provide insights into academic performance and task management.

### API Endpoints

- `GET /api/analytics/summary` - Get an overall summary of user activity
- `GET /api/analytics/courses` - Get analytics data for courses
- `GET /api/analytics/tasks` - Get task analytics data with period filtering

### Data Visualizations

The following charts are available:
1. Task Completion Trend (Line Chart)
2. Task Type Distribution (Pie Chart)
3. Task Priority Breakdown (Bar Chart)
4. Course Performance Overview (Bar Chart)
5. Course Completion Rates (Progress Bars)

### Components

- `AnalyticsPage` - Main dashboard with tabs for different analytics views

## Integration

Both the Mindmap and Analytics features integrate with other parts of the application:

- Mindmaps can be associated with specific courses
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
