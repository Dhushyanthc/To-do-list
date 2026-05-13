import React, { useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './AddTaskForm.css';

const priorityOptions = [
  { value: 1, label: 'Priority 1', color: '#d1453b', icon: '⚑' },
  { value: 2, label: 'Priority 2', color: '#eb8909', icon: '⚑' },
  { value: 3, label: 'Priority 3', color: '#246fe0', icon: '⚑' },
  { value: 4, label: 'Priority 4', color: '#808080', icon: '⚑' },
];

const AddTaskForm = ({ onSubmit, onCancel, defaultDate = null }) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(defaultDate);
  const [priority, setPriority] = useState(4);
  const [attachments, setAttachments] = useState([]);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const priorityRef = useRef(null);

  const handleSubmit = async () => {
    if (!taskName.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await onSubmit({
        task: taskName.trim(),
        description: description.trim(),
        dueDate: dueDate ? dueDate.toISOString() : null,
        priority,
        attachments
      });

      // Reset form
      setTaskName('');
      setDescription('');
      setDueDate(defaultDate);
      setPriority(4);
      setAttachments([]);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
    e.target.value = ''; // Reset file input
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDateLabel = (date) => {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) return 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (selected.getTime() === tomorrow.getTime()) return 'Tomorrow ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const currentPriority = priorityOptions.find(p => p.value === priority);

  return (
    <div className="add-task-form-wrapper">
      <div className="add-task-form-card">
        <input
          type="text"
          className="add-task-input-name"
          placeholder="Task name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <input
          type="text"
          className="add-task-input-desc"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Toolbar */}
        <div className="add-task-toolbar">
          {/* Date picker */}
          <div className="toolbar-item">
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Time"
              customInput={
                <button className={`toolbar-btn ${dueDate ? 'toolbar-btn--active' : ''}`} type="button">
                  📅 {dueDate ? formatDateLabel(dueDate) : 'Deadline'}
                  {dueDate && (
                    <span
                      className="toolbar-btn-clear"
                      onClick={(e) => { e.stopPropagation(); setDueDate(null); }}
                    >
                      ✕
                    </span>
                  )}
                </button>
              }
              dateFormat="MMM d, yyyy h:mm aa"
              minDate={new Date()}
              popperPlacement="bottom-start"
            />
          </div>

          {/* Attachment */}
          <button
            className={`toolbar-btn ${attachments.length > 0 ? 'toolbar-btn--active' : ''}`}
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            📎 Attachment{attachments.length > 0 && ` (${attachments.length})`}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
          />

          {/* Priority */}
          <div className="toolbar-item toolbar-item--priority" ref={priorityRef}>
            <button
              className={`toolbar-btn ${priority < 4 ? 'toolbar-btn--active' : ''}`}
              type="button"
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              style={{ color: priority < 4 ? currentPriority.color : undefined }}
            >
              ⚑ Priority{priority < 4 ? ` ${priority}` : ''}
            </button>
            {showPriorityMenu && (
              <div className="priority-dropdown">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`priority-option ${priority === opt.value ? 'priority-option--selected' : ''}`}
                    onClick={() => { setPriority(opt.value); setShowPriorityMenu(false); }}
                  >
                    <span style={{ color: opt.color }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attached files preview */}
        {attachments.length > 0 && (
          <div className="attached-files-list">
            {attachments.map((file, index) => (
              <div key={index} className="attached-file-chip">
                <span className="attached-file-name">{file.name}</span>
                <span className="attached-file-size">{formatFileSize(file.size)}</span>
                <button className="attached-file-remove" onClick={() => removeAttachment(index)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="add-task-actions">
          <button className="btn-task-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="btn-task-submit"
            onClick={handleSubmit}
            disabled={!taskName.trim() || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskForm;
