import React, { useState, useEffect } from 'react';
import { syncOfflineData, isOnline as checkIsOnline } from '../services/api';
import { getAllItems, getOfflineLimitations } from '../services/offlineApi';
import './NetworkStatus.css';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);
  const [showLimitations, setShowLimitations] = useState(false);
  const [syncResults, setSyncResults] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [pendingActions, setPendingActions] = useState(0);
  const [complexOperations, setComplexOperations] = useState([]);

  // Function to check for offline limitations and pending actions
  const checkOfflineLimitations = async () => {
    try {
      // Get offline limitations including pending uploads, actions, and complex operations
      const limitations = await getOfflineLimitations();
      
      // Update state with the retrieved information
      setPendingUploads(limitations.pendingUploads);
      setPendingActions(limitations.pendingActions);
      setComplexOperations(limitations.complexOperations);
    } catch (error) {
      console.error('Error checking offline limitations:', error);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowMessage(true);
      setSyncMessage('You are back online! Click to sync your data.');
      // Auto-hide the message after 3 seconds
      setTimeout(() => setShowMessage(false), 3000);
      // Check for offline limitations when coming back online
      checkOfflineLimitations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowMessage(true);
      setSyncMessage('You are offline. Changes will be saved locally.');
      setSyncResults(null);
      // Auto-hide the message after 3 seconds
      setTimeout(() => setShowMessage(false), 3000);
      // Check for offline limitations when going offline
      checkOfflineLimitations();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for offline limitations on component mount
    checkOfflineLimitations();
    
    // Set up interval to periodically check for offline limitations
    const limitationsCheckInterval = setInterval(checkOfflineLimitations, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(limitationsCheckInterval);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      setSyncMessage('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Syncing data...');
    
    try {
      setShowMessage(true);
      
      const result = await syncOfflineData();
      setSyncResults(result);
      
      // Check for offline limitations after sync
      await checkOfflineLimitations();
      
      setSyncMessage(result.message || `Sync complete! ${result.success} items synchronized.`);
      setTimeout(() => {
        setShowMessage(false);
        setSyncResults(null);
      }, 5000);
    } catch (error) {
      setSyncMessage(`Sync failed: ${error.message}`);
      setTimeout(() => setShowMessage(false), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleLimitations = () => {
    setShowLimitations(!showLimitations);
  };

  return (
    <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
        {pendingUploads > 0 && (
          <span className="pending-uploads" title="Pending file uploads">
            📤 {pendingUploads}
          </span>
        )}
        {pendingActions > 0 && (
          <span className="pending-actions" title="Pending actions to sync">
            🔄 {pendingActions}
          </span>
        )}
        <button 
          className="info-button" 
          onClick={toggleLimitations}
          aria-label="Toggle offline limitations info"
          title="Show offline mode limitations"
        >
          ℹ️
        </button>
      </div>
      
      {showLimitations && (
        <div className="limitations-info">
          <h4>Offline Mode Limitations</h4>
          <button 
            className="close-button" 
            onClick={() => setShowLimitations(false)}
          >
            ×
          </button>
          
          {pendingUploads > 0 && (
            <div className="pending-section">
              <h5>Pending Uploads</h5>
              <p>{pendingUploads} file upload{pendingUploads !== 1 ? 's' : ''} waiting to be synchronized</p>
            </div>
          )}
          
          {pendingActions > 0 && (
            <div className="pending-section">
              <h5>Pending Actions</h5>
              <p>{pendingActions} action{pendingActions !== 1 ? 's' : ''} waiting to be synchronized</p>
            </div>
          )}
          
          <div className="limitations-section">
            <h5>Feature Limitations</h5>
            <ul>
              <li>File uploads will be stored locally and uploaded when you're back online.</li>
              <li>Last-write-wins strategy is used for conflict resolution.</li>
              {complexOperations.map((op, index) => (
                <li key={index}>
                  <strong>{op.name}:</strong> {op.description} 
                  <span className={`status-badge ${op.status}`}>{op.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {!isOnline && (
        <div className="offline-message">
          Working offline. Data will sync when you reconnect.
          <div className="limitations-hint">
            <small>Some features are limited. Click ℹ️ for details.</small>
          </div>
        </div>
      )}
      
      {isOnline && (
        <button 
          className="sync-button" 
          onClick={handleSync} 
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing...' : pendingUploads > 0 ? `Sync Now (${pendingUploads} uploads pending)` : 'Sync Now'}
        </button>
      )}
      
      {showMessage && (
        <div className="status-message">
          <span>{syncMessage}</span>
          {isOnline && !isSyncing && (syncMessage.includes('back online') || pendingUploads > 0 || pendingActions > 0) && (
            <button 
              onClick={handleSync} 
              className="sync-button"
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : (pendingUploads > 0 || pendingActions > 0) ? 
                `Sync Now (${pendingUploads + pendingActions} items pending)` : 'Sync Now'}
            </button>
          )}
        </div>
      )}
      
      {syncResults && (
        <div className="sync-results">
          {syncResults.success > 0 && <span>✅ {syncResults.success} items synced</span>}
          {syncResults.fileUploads > 0 && <span>📤 {syncResults.fileUploads} files uploaded</span>}
          {syncResults.conflicts > 0 && <span>⚠️ {syncResults.conflicts} conflicts resolved</span>}
          {syncResults.failed > 0 && <span>❌ {syncResults.failed} items failed</span>}
        </div>
      )}
      
      {!showMessage && isOnline && (pendingUploads > 0 || pendingActions > 0) && (
        <div className="pending-uploads-message">
          <span>
            {pendingUploads > 0 && pendingActions > 0 ? (
              `You have ${pendingUploads} pending file upload${pendingUploads !== 1 ? 's' : ''} and ${pendingActions} pending action${pendingActions !== 1 ? 's' : ''}`
            ) : pendingUploads > 0 ? (
              `You have ${pendingUploads} pending file upload${pendingUploads !== 1 ? 's' : ''}`
            ) : (
              `You have ${pendingActions} pending action${pendingActions !== 1 ? 's' : ''}`
            )}
          </span>
          <button onClick={handleSync} className="sync-button-small">
            Sync Now
          </button>
        </div>
      )}
    </div>
  );
};

export default NetworkStatus;