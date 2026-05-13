# Todo List Application

A full-stack MERN (MongoDB, Express, React, Node.js) todo list application with a clean, responsive UI.

## Features

- ✅ Create, read, update, and delete tasks
- ✅ Mark tasks as completed or in progress
- ✅ Search functionality to filter tasks
- ✅ Status filter (All, In Progress, Completed)
- ✅ Loading screen on startup
- ✅ Responsive design for mobile and desktop
- ✅ Clean UI with custom color scheme

## Color Scheme

- Background: `#FFF6DE` (Cream)
- Primary: `#427AB5` (Blue)
- Secondary: `#124170` (Dark Blue)

## Project Structure

```
To_do_list/
├── backend/
│   ├── models/
│   │   └── Task.js
│   ├── handlers/
│   │   └── taskHandlers.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── LoadingScreen.js
    │   │   ├── LoadingScreen.css
    │   │   ├── HomePage.js
    │   │   └── HomePage.css
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas account)
- npm or yarn

## Installation & Setup

### 1. Clone or Navigate to Project Directory

```bash
cd To_do_list
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/todolist
# PORT=5000
```

**Start MongoDB locally (if using local MongoDB):**
```bash
mongod
```

**Start the backend server:**
```bash
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Tasks

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a single task by taskId
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task (status or task text)
- `DELETE /api/tasks/:id` - Delete a task

### Health Check

- `GET /api/health` - Check if server is running

## Task Schema

```javascript
{
  taskId: String (UUID, unique),
  task: String (required),
  status: String (enum: ['completed', 'progress'], default: 'progress'),
  createdAt: Date,
  updatedAt: Date
}
```

## Usage

1. **Loading Screen**: When you first open the app, you'll see a loading screen for 2 seconds
2. **Add Task**: Type your task in the input field and click "Add Task"
3. **Search**: Use the search bar to filter tasks by text
4. **Filter**: Use the dropdown to filter by status (All, In Progress, Completed)
5. **Complete Task**: Click the checkbox to mark a task as completed
6. **Edit Task**: Click the edit button (✎) to modify a task
7. **Delete Task**: Click the delete button (🗑) to remove a task
8. **View Stats**: See total, in progress, and completed task counts at the bottom

## Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop (1024px and above)
- Tablet (768px - 1023px)
- Mobile (below 768px)

## Technologies Used

### Frontend
- React 18
- Axios (API calls)
- CSS3 (Responsive design)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- UUID (for unique task IDs)
- CORS (Cross-Origin Resource Sharing)

## Development Scripts

### Backend
```bash
npm start      # Start the server
npm run dev    # Start with nodemon (auto-restart on changes)
```

### Frontend
```bash
npm start      # Start development server
npm build      # Create production build
npm test       # Run tests
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or your MongoDB Atlas connection string is correct
- Check that the port 27017 is not blocked
- Verify your .env file has the correct MONGODB_URI

### Port Already in Use
- Backend: Change PORT in .env file
- Frontend: Set PORT environment variable before starting

### CORS Issues
- The backend is configured to accept requests from any origin
- If you face issues, check the CORS configuration in server.js

## Future Enhancements

- [ ] User authentication
- [ ] Task categories/tags
- [ ] Due dates and reminders
- [ ] Priority levels
- [ ] Dark mode
- [ ] Drag and drop task reordering

## License

This project is open source and available under the MIT License.

## Author

Created for a full-stack development task.
