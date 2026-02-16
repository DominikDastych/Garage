import { openDB } from 'idb';

const DB_NAME = 'SportTixDB';
const DB_VERSION = 1;

let dbInstance = null;

export const initDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
          console.log('Created settings store');
        }
        
        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
          eventsStore.createIndex('sport', 'sport', { unique: false });
          eventsStore.createIndex('city', 'city', { unique: false });
          eventsStore.createIndex('date', 'date', { unique: false });
          console.log('Created events store with indices');
        }
        
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'eventId' });
          console.log('Created favorites store');
        }
        
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart', { keyPath: 'id' });
          console.log('Created cart store');
        }
        
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
          console.log('Created orders store');
        }
        
        if (!db.objectStoreNames.contains('recentlyViewed')) {
          db.createObjectStore('recentlyViewed', { keyPath: 'eventId' });
          console.log('Created recentlyViewed store');
        }
      },
      blocked() {
        console.warn('Database upgrade blocked');
      },
      blocking() {
        console.warn('Database blocking');
      },
    });

    console.log('IndexedDB initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
    throw error;
  }
};

export const getDB = async () => {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
};
