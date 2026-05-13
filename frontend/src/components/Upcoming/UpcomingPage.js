import React, { useState, useMemo, useCallback } from 'react';
import TaskItem from '../shared/TaskItem';
import AddTaskForm from '../shared/AddTaskForm';
import './UpcomingPage.css';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const UpcomingPage = ({ tasks, onCreateTask, onToggleStatus, onEditTask, onDeleteTask, onDeleteAttachment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [addFormDate, setAddFormDate] = useState(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Calendar data computation
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week for first day (0=Sun, adjust to Mon=0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const daysInMonth = lastDay.getDate();

    // Previous month days to fill
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = [];
    for (let i = startDay - 1; i >= 0; i--) {
      prevMonthDays.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        day: prevMonthLastDay - i
      });
    }

    // Current month days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        day: i
      });
    }

    // Next month days to fill (complete the grid to 6 rows max)
    const totalCells = prevMonthDays.length + currentMonthDays.length;
    const remainingCells = totalCells <= 35 ? (35 - totalCells) : (42 - totalCells);
    const nextMonthDays = [];
    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        day: i
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentDate]);

  // Tasks grouped by date string
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  const getTasksForDate = useCallback((date) => {
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      .toISOString().split('T')[0];
    return tasksByDate[key] || [];
  }, [tasksByDate]);

  const isToday = useCallback((date) => {
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  }, [today]);

  const isSelected = useCallback((date) => {
    if (!selectedDate) return false;
    return date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate();
  }, [selectedDate]);

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + direction);
      return d;
    });
    setSelectedDate(null);
    setAddFormDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setAddFormDate(null);
  };

  const handleDayClick = (cellData) => {
    const d = new Date(cellData.date);
    d.setHours(0, 0, 0, 0);
    setSelectedDate(d);
    setAddFormDate(null);
  };

  const formatDayHeader = (date) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const parts = [];
    parts.push(`${date.getDate()} ${monthNames[date.getMonth()]}`);

    if (isToday(date)) {
      parts.push('Today');
    } else {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (date.getTime() === tomorrow.getTime()) {
        parts.push('Tomorrow');
      }
    }

    parts.push(dayNames[date.getDay()]);
    return parts.join(' · ');
  };

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="upcoming-page">
      <div className="page-header">
        <h1 className="page-title">Upcoming</h1>
      </div>

      {/* Calendar Navigation */}
      <div className="calendar-nav">
        <div className="calendar-nav-left">
          <h2 className="calendar-month-title">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
        <div className="calendar-nav-right">
          <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)} title="Previous month">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="calendar-today-btn" onClick={goToToday}>Today</button>
          <button className="calendar-nav-btn" onClick={() => navigateMonth(1)} title="Next month">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid-container">
        <div className="calendar-grid">
          {/* Header row */}
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="calendar-header-cell">{day}</div>
          ))}

          {/* Day cells */}
          {calendarData.map((cellData, index) => {
            const dateTasks = getTasksForDate(cellData.date);
            const isTodayCell = isToday(cellData.date);
            const isSelectedCell = isSelected(cellData.date);

            return (
              <div
                key={index}
                className={`calendar-day-cell ${!cellData.isCurrentMonth ? 'calendar-day-cell--other-month' : ''} ${isTodayCell ? 'calendar-day-cell--today' : ''} ${isSelectedCell ? 'calendar-day-cell--selected' : ''}`}
                onClick={() => handleDayClick(cellData)}
              >
                <div className="calendar-day-number-row">
                  <span className={`calendar-day-number ${isTodayCell ? 'calendar-day-number--today' : ''}`}>
                    {cellData.day}
                  </span>
                  {dateTasks.length > 0 && (
                    <span className="calendar-task-count">{dateTasks.length}</span>
                  )}
                </div>
                <div className="calendar-day-tasks">
                  {dateTasks.slice(0, 2).map(task => (
                    <div
                      key={task.taskId}
                      className={`calendar-task-chip ${task.status === 'completed' ? 'calendar-task-chip--done' : ''}`}
                      style={{ borderLeftColor: task.priority === 1 ? '#d1453b' : task.priority === 2 ? '#eb8909' : task.priority === 3 ? '#246fe0' : 'transparent' }}
                      title={task.task}
                    >
                      {task.task}
                    </div>
                  ))}
                  {dateTasks.length > 2 && (
                    <div className="calendar-task-more">+{dateTasks.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail (mobile list view doubles as expanded view) */}
      {selectedDate && (
        <div className="selected-day-section">
          <div className="selected-day-header">
            <h3>{formatDayHeader(selectedDate)}</h3>
          </div>

          <div className="selected-day-tasks">
            {selectedTasks.map(task => (
              <TaskItem
                key={task.taskId}
                task={task}
                onToggleStatus={onToggleStatus}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onDeleteAttachment={onDeleteAttachment}
              />
            ))}
          </div>

          {addFormDate && addFormDate.getTime() === selectedDate.getTime() ? (
            <AddTaskForm
              onSubmit={(data) => {
                onCreateTask({ ...data, dueDate: selectedDate.toISOString() });
                setAddFormDate(null);
              }}
              onCancel={() => setAddFormDate(null)}
              defaultDate={selectedDate}
            />
          ) : (
            <button
              className="add-task-trigger"
              onClick={() => setAddFormDate(selectedDate)}
            >
              <span className="add-task-trigger-icon">+</span>
              <span>Add task</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile: Date-grouped list view */}
      <div className="upcoming-list-view">
        {(() => {
          // Build a list of dates from today + 14 days that have tasks or are significant
          const datesToShow = [];
          const endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 30);

          for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = new Date(d).toISOString().split('T')[0];
            const dateTasks = tasksByDate[dateKey] || [];
            datesToShow.push({
              date: new Date(d),
              tasks: dateTasks,
              key: dateKey
            });
          }

          return datesToShow.map(({ date, tasks: dayTasks, key }) => (
            <div key={key} className="upcoming-day-group">
              <div className="upcoming-day-group-header">
                <h3>{formatDayHeader(date)}</h3>
              </div>

              {dayTasks.map(task => (
                <TaskItem
                  key={task.taskId}
                  task={task}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onDeleteAttachment={onDeleteAttachment}
                />
              ))}

              {addFormDate && addFormDate.toISOString().split('T')[0] === key ? (
                <AddTaskForm
                  onSubmit={(data) => {
                    onCreateTask({ ...data, dueDate: date.toISOString() });
                    setAddFormDate(null);
                  }}
                  onCancel={() => setAddFormDate(null)}
                  defaultDate={date}
                />
              ) : (
                <button
                  className="add-task-trigger add-task-trigger--small"
                  onClick={() => setAddFormDate(date)}
                >
                  <span className="add-task-trigger-icon">+</span>
                  <span>Add task</span>
                </button>
              )}
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

export default UpcomingPage;
