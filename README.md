# Advanced Full-Stack Task & Project Management App

A sophisticated, full-stack MERN (MongoDB, Express, React, Node.js) application heavily inspired by Todoist. It features secure user authentication, project-scoped task management, file attachments, deadline tracking, and AI-powered progress reporting via Google Gemini.

## 🚀 Features

- **User Authentication:** Secure signup/login with JWT session management and bcrypt password hashing.
- **Project Management:** Create private projects, set project-level deadlines, and track task progress.
- **Task Organization:**
  - Create, read, update, and delete tasks.
  - Set specific Due Dates and Times.
  - Set Priorities (P1, P2, P3, P4) with visual color badges.
  - Add descriptions and attach files (images, documents, PDFs) directly to tasks.
- **AI Progress Reports:** Generate dynamic, intelligent summaries of your project's progress and upcoming deadlines using the Google Gemini 2.5 Flash API.
- **Smart Filtering & Searching:** Search for tasks by name, or use dedicated Inbox/Today/Upcoming tabs.
- **Responsive UI:** Clean, modern, warm color scheme (`#FFF6DE` background) with a fully responsive layout for desktop, tablet, and mobile. Sidebar navigation with a collapsible profile menu.

## 🛠️ Technology Stack

### Frontend
- **React 18** (Context API for Auth state management)
- **Axios** (With interceptors for JWT token injection)
- **React Router v7** (Protected routing and navigation)
- **React DatePicker** & **React Select**
- Vanilla CSS (Custom layouts, responsive media queries, and animations)

### Backend
- **Node.js & Express.js**
- **MongoDB & Mongoose** (User, Project, and Task schemas)
- **JSON Web Tokens (JWT) & bcryptjs** (Authentication & security)
- **Multer** (Local file uploading and storage)
- **Google Generative AI SDK** (Gemini 2.5 integration)

## 📁 Project Structure

```
To_do_list/
├── backend/
│   ├── handlers/         # Express route handlers (auth, tasks, projects, reports)
│   ├── middleware/       # JWT Auth verification middleware
│   ├── models/           # Mongoose schemas (User, Task, Project)
│   ├── uploads/          # Local storage for task attachments
│   ├── server.js         # Entry point and Express configuration
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/   # UI components (Sidebar, TodayPage, ProjectsPage, etc.)
    │   ├── context/      # AuthContext for global session state
    │   ├── App.js        # Main routing and layout wrapper
    │   └── index.css     # Global styles and CSS variables
    └── package.json
```

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v16+)
- MongoDB (running locally or MongoDB Atlas)
- A Google Gemini API Key

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
MONGODB_URI=mongodb://localhost:27017/todolist
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
# For local development:
REACT_APP_API_URL=http://localhost:5000

# For production, change this to your deployed backend URL
```

Start the React frontend:
```bash
npm start
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/auth/me` - Validate JWT and get user profile
- `PUT /api/auth/change-password` - Update user password

### Projects (Protected)
- `GET /api/projects` - Get all projects for user
- `GET /api/projects/:id` - Get specific project (with populated tasks)
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project details/deadline
- `DELETE /api/projects/:id` - Delete project

### Tasks (Protected)
- `GET /api/tasks` - Get all tasks (optional `?projectId=` query)
- `POST /api/tasks` - Create task (supports multipart form data for file uploads)
- `PUT /api/tasks/:id` - Update task / add attachments
- `DELETE /api/tasks/:id` - Delete task and its local files
- `DELETE /api/tasks/:id/attachments/:attachmentId` - Remove specific attachment

### AI Reports (Protected)
- `POST /api/report/generate` - Analyze project tasks using Gemini and return markdown summary

## 🚢 Deployment

**Frontend (Vercel/Netlify):**
Ensure your build command is configured properly. If using Vercel, you may need to disable the strict CI warnings by setting the build script in `package.json` to:
`"build": "CI=false react-scripts build"`

**Backend (Render/Heroku):**
Ensure the deployment service has access to read/write the `uploads/` directory if persisting files locally. Set all environment variables (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`) in your hosting provider's dashboard.

## 📄 License
This project is open source and available under the MIT License.
