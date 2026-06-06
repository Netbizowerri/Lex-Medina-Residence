import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { INITIAL_ROOMS } from '../db';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log('Starting migration of hardcoded rooms to Firestore apartments collection...');
  const apartmentsRef = collection(db, 'apartments');

  for (const room of INITIAL_ROOMS) {
    const apartmentData = {
      id: room.id,
      title: room.name,
      description: room.description,
      price: room.price,
      media: room.images.map(url => ({ type: 'image', url })),
      features: room.features,
      status: room.is_available ? 'available' : 'occupied',
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(apartmentsRef, room.id), apartmentData);
      console.log(`✅ Migrated: ${room.name} (${room.id})`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${room.name}:`, error);
    }
  }

  console.log('\nMigration complete!');
}

migrate().catch(console.error);
