import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './SettingsModal.css';

const SettingsModal = ({ onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('account'); // 'account' or 'password'
  
  // Account state
  const [name, setName] = useState(user?.name || '');
  const [accountMsg, setAccountMsg] = useState('');
  const [accountError, setAccountError] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSaveAccount = async () => {
    setAccountMsg('');
    setAccountError('');
    setIsSavingAccount(true);
    
    try {
      const result = await updateProfile({ name });
      if (result.success) {
        setAccountMsg('Profile updated successfully');
      } else {
        setAccountError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setAccountError('An error occurred');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordMsg('');
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setIsSavingPassword(true);
    
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setPasswordMsg('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setActiveTab('account'); // go back to account tab
      } else {
        setPasswordError(result.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('An error occurred');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Account</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="settings-body">
          {activeTab === 'account' ? (
            <div className="settings-content">
              {accountMsg && <div className="settings-msg success">{accountMsg}</div>}
              {accountError && <div className="settings-msg error">{accountError}</div>}
              
              <div className="settings-section">
                <h3>Photo</h3>
                <div className="settings-photo-row">
                  <div className="settings-avatar-large">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Name</h3>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="settings-input"
                />
              </div>

              <div className="settings-section">
                <h3>Email</h3>
                <p className="settings-read-only">{user?.email}</p>
              </div>

              <div className="settings-section">
                <h3>Password</h3>
                <button 
                  className="settings-btn-secondary"
                  onClick={() => setActiveTab('password')}
                >
                  Change password
                </button>
              </div>

              <div className="settings-actions">
                <button className="settings-btn-primary" onClick={handleSaveAccount} disabled={isSavingAccount || name === user?.name}>
                  {isSavingAccount ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>
          ) : (
            <div className="settings-content">
              <button className="settings-back-btn" onClick={() => setActiveTab('account')}>
                ← Back to Account
              </button>
              
              {passwordMsg && <div className="settings-msg success">{passwordMsg}</div>}
              {passwordError && <div className="settings-msg error">{passwordError}</div>}
              
              <div className="settings-section">
                <h3>Current Password</h3>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="settings-input"
                  />
                  <button className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h3>New Password</h3>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    className="settings-input"
                  />
                </div>
              </div>

              <div className="settings-section">
                <h3>Confirm New Password</h3>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="settings-input"
                  />
                </div>
              </div>

              <div className="settings-actions">
                <button className="settings-btn-secondary" onClick={() => setActiveTab('account')}>
                  Cancel
                </button>
                <button className="settings-btn-primary" onClick={handleSavePassword} disabled={isSavingPassword || !currentPassword || !newPassword}>
                  {isSavingPassword ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
