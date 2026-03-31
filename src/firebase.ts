import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBuz4fQztDE82mZXgFLG7KDvpYGa9_5XLE',
  authDomain: 'flowly-270820.firebaseapp.com',
  projectId: 'flowly-270820',
  storageBucket: 'flowly-270820.firebasestorage.app',
  messagingSenderId: '381641710331',
  appId: '1:381641710331:web:e103b661c560d3ef64ae5e',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
