import React from 'react';
import './TaskItem.css';

const API_URL = process.env.REACT_APP_API_URL;

const priorityColors = {
  1: '#d1453b',
  2: '#eb8909',
  3: '#246fe0',
  4: 'transparent'
};

const priorityLabels = {
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: ''
};

const TaskItem = ({ task, onToggleStatus, onEdit, onDelete, onDeleteAttachment }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(task.task);
  const [editDescription, setEditDescription] = React.useState(task.description || '');
  const [showAttachments, setShowAttachments] = React.useState(false);

  const handleSave = () => {
    if (!editText.trim()) return;
    onEdit(task.taskId, { task: editText, description: editDescription });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(task.task);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return '📊';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '📽️';
    if (mimetype.startsWith('text/')) return '📃';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return '📦';
    return '📎';
  };

  if (isEditing) {
    return (
      <div className="task-item task-item--editing">
        <div className="task-edit-form">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="task-edit-input"
            placeholder="Task name"
            autoFocus
          />
          <input
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            className="task-edit-description"
            placeholder="Description"
          />
          <div className="task-edit-actions">
            <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
            <button className="btn-save" onClick={handleSave} disabled={!editText.trim()}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`task-item ${task.status === 'completed' ? 'task-item--completed' : ''}`}
      style={{ borderLeftColor: priorityColors[task.priority || 4] }}
    >
      <div className="task-item__main">
        <button
          className={`task-checkbox ${task.status === 'completed' ? 'task-checkbox--checked' : ''}`}
          onClick={() => onToggleStatus(task.taskId, task.status)}
          aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
          style={{
            borderColor: task.status === 'completed' ? '#427AB5' : (priorityColors[task.priority || 4] !== 'transparent' ? priorityColors[task.priority || 4] : '#ccc')
          }}
        >
          {task.status === 'completed' && (
            <svg viewBox="0 0 12 12" width="12" height="12">
              <path d="M1 6l3.5 3.5L11 2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="task-content">
          <span className="task-name">{task.task}</span>
          {task.description && (
            <span className="task-description">{task.description}</span>
          )}
          <div className="task-meta">
            {task.dueDate && (
              <span className="task-due-date">
                📅 {new Date(task.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(', 12:00 AM', '')}
              </span>
            )}
            {task.priority && task.priority < 4 && (
              <span className="task-priority-badge" style={{ color: priorityColors[task.priority] }}>
                ⚑ {priorityLabels[task.priority]}
              </span>
            )}
            {task.attachments && task.attachments.length > 0 && (
              <button
                className="task-attachment-badge"
                onClick={(e) => { e.stopPropagation(); setShowAttachments(!showAttachments); }}
              >
                📎 {task.attachments.length}
              </button>
            )}
            {task.projectName && (
              <span className="task-project-badge" style={{ color: '#808080', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px' }}>📁</span> {task.projectName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="task-actions">
        <button
          className="task-action-btn task-action-btn--edit"
          onClick={() => {
            setEditText(task.task);
            setEditDescription(task.description || '');
            setIsEditing(true);
          }}
          disabled={task.status === 'completed'}
          title="Edit task"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button
          className="task-action-btn task-action-btn--delete"
          onClick={() => onDelete(task.taskId)}
          title="Delete task"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>

      {/* Attachments dropdown */}
      {showAttachments && task.attachments && task.attachments.length > 0 && (
        <div className="task-attachments-panel">
          {task.attachments.map((att) => (
            <div key={att.attachmentId || att._id} className="attachment-row">
              <span className="attachment-icon">{getFileIcon(att.mimetype)}</span>
              <a
                href={`${API_URL}${att.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-name"
                title={att.originalName}
              >
                {att.originalName}
              </a>
              <span className="attachment-size">{formatFileSize(att.size)}</span>
              {onDeleteAttachment && (
                <button
                  className="attachment-delete-btn"
                  onClick={() => onDeleteAttachment(task.taskId, att.attachmentId || att._id)}
                  title="Remove attachment"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
