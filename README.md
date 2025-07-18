# Student Management System

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

A comprehensive student management system built with Next.js, React, Node.js, and MongoDB. This application provides functionalities for managing courses, mindmaps, resources, tasks, and user authentication.

## ✨ Features

*   **User Authentication:** Secure registration and login using NextAuth.js.
*   **Course Management:** Create, view, edit, and share courses.
*   **Mindmap Creation:** Collaborative mindmap editor with real-time updates.
*   **Resource Management:** Upload and manage various learning resources.
*   **Task Tracking:** Organize and track student tasks and deadlines.
*   **Analytics:** View analytics related to courses and mindmaps.
*   **Notifications:** Real-time notifications for important updates.
*   **Cloudinary Integration:** Seamless image and file uploads.
*   **Socket.IO:** Real-time communication for collaborative features.

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

*   Node.js (v18 or higher)
*   npm or yarn
*   MongoDB instance (local or cloud-hosted)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/student.git
    cd student
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add the following environment variables:

    ```
    MONGODB_URI=your_mongodb_connection_string
    NEXTAUTH_SECRET=your_nextauth_secret
    NEXTAUTH_URL=http://localhost:3000
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    # Add any other necessary environment variables
    ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 API Endpoints

The application exposes various API endpoints for managing data. Here's a brief overview:

*   `/api/auth`: User authentication (login, register, session management).
*   `/api/courses`: CRUD operations for courses.
*   `/api/mindmaps`: CRUD operations for mindmaps, including collaborative features.
*   `/api/resources`: CRUD operations for learning resources.
*   `/api/tasks`: CRUD operations for student tasks.
*   `/api/analytics`: Endpoints for fetching analytical data.
*   `/api/upload`: Endpoint for handling file uploads to Cloudinary.
*   `/api/socket`: Socket.IO integration for real-time features.

## 🧪 Testing

The project uses Jest for unit and integration testing.

To run all tests:
```bash
npm test
# or
yarn test
```

To run tests in watch mode:
```bash
npm run test:watch
# or
yarn test:watch
```

To generate test coverage reports:
```bash
npm run test:coverage
# or
yarn test:coverage
```

## 🛠️ Technologies Used

*   **Frontend:**
    *   Next.js
    *   React
    *   Tailwind CSS
    *   Shadcn/ui
    *   React Flow (for mindmaps)
    *   React Query (for data fetching)
*   **Backend:**
    *   Node.js
    *   Express.js (implicitly via Next.js API routes)
    *   MongoDB (with Mongoose)
    *   NextAuth.js (for authentication)
    *   Socket.IO
    *   Cloudinary SDK
*   **Testing:**
    *   Jest
    *   React Testing Library

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.