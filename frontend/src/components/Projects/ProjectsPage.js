import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ProjectsPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects`);
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await axios.post(`${API_URL}/api/projects`, {
        name: newProjectName,
        description: newProjectDesc,
        deadline: newProjectDeadline ? newProjectDeadline.toISOString() : null
      });
      
      if (response.data.success) {
        setProjects([response.data.data, ...projects]);
        setShowCreateModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
        setNewProjectDeadline(null);
      }
    } catch (err) {
      setError('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation(); // prevent navigation
    if (!window.confirm('Are you sure you want to delete this project and all its tasks?')) return;
    
    try {
      const response = await axios.delete(`${API_URL}/api/projects/${projectId}`);
      if (response.data.success) {
        setProjects(projects.filter(p => p.projectId !== projectId));
      }
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  if (isLoading) return <div className="projects-loading">Loading projects...</div>;

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>My Projects</h1>
        <button className="create-project-btn" onClick={() => setShowCreateModal(true)}>
          + Add Project
        </button>
      </div>

      {error && <div className="projects-error">{error}</div>}

      {projects.length === 0 ? (
        <div className="projects-empty">
          <div className="projects-empty-icon">📁</div>
          <h3>Create your first project</h3>
          <p>Organize your tasks into projects to keep them grouped together.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div 
              key={project.projectId} 
              className="project-card"
              onClick={() => navigate(`/projects/${project.projectId}`)}
            >
              <div className="project-card-header">
                <h3>{project.name}</h3>
                <button 
                  className="project-delete-btn"
                  onClick={(e) => handleDeleteProject(project.projectId, e)}
                  title="Delete project"
                >
                  ✕
                </button>
              </div>
              
              {project.deadline && (
                <div className="project-card-deadline" style={{ fontSize: '12px', color: '#d1453b', marginBottom: '8px', fontWeight: '600' }}>
                  Deadline: {new Date(project.deadline).toLocaleDateString()}
                </div>
              )}
              
              {project.description && (
                <p className="project-card-desc">{project.description}</p>
              )}
              
              <div className="project-card-stats">
                <div className="stat">
                  <span className="stat-value">{project.progressTasks}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{project.completedTasks}</span>
                  <span className="stat-label">Completed</span>
                </div>
              </div>
              
              <div className="project-progress-bar">
                <div 
                  className="project-progress-fill" 
                  style={{ 
                    width: project.totalTasks > 0 
                      ? `${(project.completedTasks / project.totalTasks) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="project-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="project-modal" onClick={e => e.stopPropagation()}>
            <h2>Add Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g. Work, Personal, Marketing Campaign"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea 
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  placeholder="Add some details about this project..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Project Deadline (optional)</label>
                <DatePicker
                  selected={newProjectDeadline}
                  onChange={(date) => setNewProjectDeadline(date)}
                  isClearable
                  placeholderText="Select deadline date"
                  dateFormat="MMM d, yyyy"
                  minDate={new Date()}
                  className="settings-input"
                />
              </div>
              <div className="project-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isCreating || !newProjectName.trim()}>
                  {isCreating ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
