import React, { useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfileMenu.css';

const ProfileMenu = ({ onClose, onOpenSettings, tasksCount = 0 }) => {
  const { user, logout } = useAuth();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="profile-menu" ref={menuRef}>
      <div className="profile-menu-header">
        <div className="profile-menu-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-menu-info">
          <div className="profile-menu-name">{user?.name}</div>
          <div className="profile-menu-subtext">0/{tasksCount} tasks</div>
        </div>
      </div>
      
      <div className="profile-menu-divider"></div>
      
      <button className="profile-menu-item" onClick={() => { onClose(); onOpenSettings(); }}>
        <span className="profile-menu-icon">⚙️</span>
        <span className="profile-menu-text">Settings</span>
        <span className="profile-menu-shortcut">O then S</span>
      </button>
      
      <div className="profile-menu-divider"></div>

      <button className="profile-menu-item" onClick={() => window.location.reload()}>
        <span className="profile-menu-icon">🔄</span>
        <span className="profile-menu-text">Sync</span>
        <span className="profile-menu-shortcut">just now</span>
      </button>

      <div className="profile-menu-divider"></div>

      <button className="profile-menu-item" onClick={logout}>
        <span className="profile-menu-icon">🚪</span>
        <span className="profile-menu-text">Log out</span>
      </button>
    </div>
  );
};

export default ProfileMenu;
