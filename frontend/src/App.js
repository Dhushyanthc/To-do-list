import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import Sidebar from './components/Sidebar/Sidebar';
import InboxPage from './components/Inbox/InboxPage';
import TodayPage from './components/Today/TodayPage';
import UpcomingPage from './components/Upcoming/UpcomingPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import ProjectsPage from './components/Projects/ProjectsPage';
import ProjectDetail from './components/Projects/ProjectDetail';
import ReportPage from './components/Report/ReportPage';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Main App Content wrapped in Auth context
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/tasks`);
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create task (supports file attachments via FormData)
  const handleCreateTask = useCallback(async (taskData) => {
    try {
      const hasFiles = taskData.attachments && taskData.attachments.length > 0;
      let response;

      if (hasFiles) {
        const formData = new FormData();
        formData.append('task', taskData.task);
        if (taskData.description) formData.append('description', taskData.description);
        if (taskData.dueDate) formData.append('dueDate', taskData.dueDate);
        if (taskData.priority) formData.append('priority', taskData.priority);
        taskData.attachments.forEach(file => {
          formData.append('attachments', file);
        });
        response = await axios.post(`${API_URL}/api/tasks`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post(`${API_URL}/api/tasks`, {
          task: taskData.task,
          description: taskData.description || '',
          dueDate: taskData.dueDate || null,
          priority: taskData.priority || 4
        });
      }

      if (response.data.success) {
        setTasks(prev => [response.data.data, ...prev]);
        setError('');
      }
    } catch (err) {
      setError('Failed to create task');
      console.error(err);
    }
  }, []);

  // For Sidebar global add task
  const handleTaskAdded = useCallback((newTask) => {
    setTasks(prev => [newTask, ...prev]);
  }, []);

  // Toggle task status
  const handleToggleStatus = useCallback(async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'progress' : 'completed';
    try {
      const response = await axios.put(`${API_URL}/api/tasks/${taskId}`, { status: newStatus });
      if (response.data.success) {
        setTasks(prev => prev.map(task =>
          task.taskId === taskId ? { ...task, status: newStatus } : task
        ));
        setError('');
      }
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    }
  }, []);

  // Edit task
  const handleEditTask = useCallback(async (taskId, updateData) => {
    try {
      const response = await axios.put(`${API_URL}/api/tasks/${taskId}`, updateData);
      if (response.data.success) {
        setTasks(prev => prev.map(task =>
          task.taskId === taskId ? response.data.data : task
        ));
        setError('');
      }
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    }
  }, []);

  // Delete task
  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/tasks/${taskId}`);
      if (response.data.success) {
        setTasks(prev => prev.filter(task => task.taskId !== taskId));
        setError('');
      }
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    }
  }, []);

  // Delete attachment
  const handleDeleteAttachment = useCallback(async (taskId, attachmentId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/tasks/${taskId}/attachments/${attachmentId}`);
      if (response.data.success) {
        setTasks(prev => prev.map(task =>
          task.taskId === taskId ? response.data.data : task
        ));
        setError('');
      }
    } catch (err) {
      setError('Failed to delete attachment');
      console.error(err);
    }
  }, []);

  // Count today's tasks for sidebar badge
  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime() && task.status === 'progress';
    }).length;
  }, [tasks]);

  if (loading) {
    return <LoadingScreen />;
  }

  const sharedProps = {
    tasks,
    onCreateTask: handleCreateTask,
    onToggleStatus: handleToggleStatus,
    onEditTask: handleEditTask,
    onDeleteTask: handleDeleteTask,
    onDeleteAttachment: handleDeleteAttachment,
  };

  return (
    <div className={`App ${!isAuthenticated ? 'auth-mode' : ''}`}>
      {error && (
        <div className="global-error">
          <span>{error}</span>
          <button onClick={() => setError('')} className="global-error-close">✕</button>
        </div>
      )}
      
      {isAuthenticated && <Sidebar todayCount={todayCount} onTaskAdded={handleTaskAdded} />}
      
      <main className={`main-content ${!isAuthenticated ? 'main-content--full' : ''}`}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><InboxPage {...sharedProps} /></ProtectedRoute>} />
          <Route path="/today" element={<ProtectedRoute><TodayPage {...sharedProps} /></ProtectedRoute>} />
          <Route path="/upcoming" element={<ProtectedRoute><UpcomingPage {...sharedProps} /></ProtectedRoute>} />
          
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
