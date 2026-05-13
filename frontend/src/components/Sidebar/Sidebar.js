import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ProfileMenu from './ProfileMenu';
import SettingsModal from '../Settings/SettingsModal';
import AddTaskForm from '../shared/AddTaskForm';
import './Sidebar.css';

const API_URL = process.env.REACT_APP_API_URL;

const Sidebar = ({ todayCount = 0, onTaskAdded }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [showGlobalAddTask, setShowGlobalAddTask] = useState(false);
  
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects`);
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sidebar projects', err);
    }
  };

  const handleGlobalTaskAdd = async (taskData) => {
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
        setShowGlobalAddTask(false);
        if (onTaskAdded) onTaskAdded(response.data.data);
      }
    } catch (err) {
      console.error('Failed to create task globally', err);
    }
  };

  // Do not render sidebar if not logged in
  if (!isAuthenticated) return null;

  return (
    <>
      <button
        className="sidebar-hamburger"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label="Toggle sidebar"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          {isCollapsed ? (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          ) : (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          )}
        </svg>
      </button>

      {!isCollapsed && (
        <div className="sidebar-overlay" onClick={() => setIsCollapsed(true)} />
      )}

      <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-profile-btn" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
            <div className="sidebar-avatar-small">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="sidebar-username">{user?.name}</span>
            <span className="sidebar-chevron">v</span>
          </div>
          {isProfileMenuOpen && (
            <ProfileMenu 
              onClose={() => setIsProfileMenuOpen(false)} 
              onOpenSettings={() => setIsSettingsOpen(true)}
              tasksCount={projects.reduce((acc, p) => acc + p.totalTasks, 0)}
            />
          )}
        </div>

        <div className="sidebar-quick-actions">
          <button className="sidebar-add-task-btn" onClick={() => setShowGlobalAddTask(true)}>
            <span className="add-icon-circle">+</span>
            <span>Add task</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`} onClick={() => window.innerWidth <= 768 && setIsCollapsed(true)}>
            <span className="sidebar-nav-icon">📥</span>
            <span className="sidebar-nav-label">Inbox</span>
          </NavLink>

          <NavLink to="/today" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`} onClick={() => window.innerWidth <= 768 && setIsCollapsed(true)}>
            <span className="sidebar-nav-icon">📅</span>
            <span className="sidebar-nav-label">Today</span>
            {todayCount > 0 && <span className="sidebar-nav-badge">{todayCount}</span>}
          </NavLink>

          <NavLink to="/upcoming" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`} onClick={() => window.innerWidth <= 768 && setIsCollapsed(true)}>
            <span className="sidebar-nav-icon">🗓️</span>
            <span className="sidebar-nav-label">Upcoming</span>
          </NavLink>
          
          <NavLink to="/report" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`} onClick={() => window.innerWidth <= 768 && setIsCollapsed(true)}>
            <span className="sidebar-nav-icon">📈</span>
            <span className="sidebar-nav-label">Report</span>
          </NavLink>
        </nav>

        <div className="sidebar-projects-section">
          <div className="sidebar-projects-header" onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}>
            <span className="sidebar-projects-title">My Projects</span>
            <span className={`sidebar-projects-chevron ${isProjectsExpanded ? 'expanded' : ''}`}>›</span>
          </div>
          
          {isProjectsExpanded && (
            <div className="sidebar-projects-list">
              {projects.map(project => (
                <NavLink 
                  key={project.projectId}
                  to={`/projects/${project.projectId}`} 
                  className={({ isActive }) => `sidebar-project-item ${isActive ? 'sidebar-project-item--active' : ''}`}
                  onClick={() => window.innerWidth <= 768 && setIsCollapsed(true)}
                >
                  <span className="project-hash">#</span>
                  <span className="project-name">{project.name}</span>
                  {project.progressTasks > 0 && <span className="project-badge">{project.progressTasks}</span>}
                </NavLink>
              ))}
              <NavLink to="/projects" className="sidebar-project-item" onClick={() => window.innerWidth <= 768 && setIsCollapsed(true)}>
                <span className="project-add-icon">+</span>
                <span className="project-name" style={{color: '#808080'}}>View all projects...</span>
              </NavLink>
            </div>
          )}
        </div>
      </aside>

      {/* Global Modals */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      
      {showGlobalAddTask && (
        <div className="global-add-task-overlay" onClick={() => setShowGlobalAddTask(false)}>
          <div className="global-add-task-container" onClick={e => e.stopPropagation()}>
            <AddTaskForm
              onSubmit={handleGlobalTaskAdd}
              onCancel={() => setShowGlobalAddTask(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
