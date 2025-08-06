// IndexedDB utility for offline data storage

const DB_NAME = 'gurshaOfflineDB';
const DB_VERSION = 3; // Increased version to trigger database upgrade

// Define stores (tables) and their key paths
const STORES = {
  games: { keyPath: '_id', indexes: ['status', 'createdAt'] },
  participants: { keyPath: '_id', indexes: ['gameId'] },
  users: { keyPath: '_id', indexes: ['role'] },
  offlineActions: { keyPath: 'id', indexes: ['timestamp', 'synced'] },
  // Add upload stores for file uploads
  participants_uploads: { keyPath: '_id', indexes: ['status', 'createdAt'] },
  controllers_uploads: { keyPath: '_id', indexes: ['status', 'createdAt'] },
  prizes_uploads: { keyPath: '_id', indexes: ['status', 'createdAt'] },
  // Add stores for offline limitations
  limitations: { keyPath: '_id', indexes: ['type', 'active'] }
};

// Open database connection
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject('Error opening IndexedDB');
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    // Create object stores when database is first created or version is upgraded
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores based on the STORES configuration
      Object.entries(STORES).forEach(([storeName, storeConfig]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
          
          // Create indexes
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach(indexName => {
              store.createIndex(indexName, indexName, { unique: false });
            });
          }
          
          console.log(`Created store: ${storeName}`);
        }
      });
    };
  });
};

// Generic function to add an item to a store
const addItem = async (storeName, item) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error adding item to ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to add item to ${storeName}:`, error);
    throw error;
  }
};

// Generic function to get all items from a store
const getAllItems = async (storeName) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting items from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to get items from ${storeName}:`, error);
    throw error;
  }
};

// Generic function to get an item by its key
const getItemByKey = async (storeName, key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting item from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to get item from ${storeName}:`, error);
    throw error;
  }
};

// Generic function to update an item
const updateItem = async (storeName, item) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error updating item in ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to update item in ${storeName}:`, error);
    throw error;
  }
};

// Generic function to delete an item
const deleteItem = async (storeName, key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error deleting item from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to delete item from ${storeName}:`, error);
    throw error;
  }
};

// Function to get items by index
const getItemsByIndex = async (storeName, indexName, value) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting items by index from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to get items by index from ${storeName}:`, error);
    throw error;
  }
};

// Function to clear a store
const clearStore = async (storeName) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error clearing store ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Failed to clear store ${storeName}:`, error);
    throw error;
  }
};

// Function to record an offline action for later sync
const recordOfflineAction = async (action) => {
  const offlineAction = {
    id: Date.now().toString(),
    ...action,
    timestamp: new Date().toISOString(),
    synced: 0  // Use 0 instead of false for consistency with index.getAll(0)
  };
  
  return await addItem('offlineActions', offlineAction);
};

// Function to get all pending offline actions
const getPendingOfflineActions = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('offlineActions', 'readonly');
      const store = transaction.objectStore('offlineActions');
      const index = store.index('synced');
      // Use 0 instead of false for the index key to fix the DataError
      const request = index.getAll(0);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting pending offline actions:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get pending offline actions:', error);
    throw error;
  }
};

// Function to mark an offline action as synced
const markOfflineActionSynced = async (actionId) => {
  try {
    const action = await getItemByKey('offlineActions', actionId);
    if (action) {
      action.synced = 1;  // Use 1 instead of true for consistency with synced: 0
      await updateItem('offlineActions', action);
    }
  } catch (error) {
    console.error('Failed to mark offline action as synced:', error);
    throw error;
  }
};

export {
  openDB,
  addItem,
  getAllItems,
  getItemByKey,
  updateItem,
  deleteItem,
  getItemsByIndex,
  clearStore,
  recordOfflineAction,
  getPendingOfflineActions,
  markOfflineActionSynced
};