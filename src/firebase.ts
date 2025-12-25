// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "REDACTED_API_KEY",
  authDomain: "ruangkopi-surabaya.firebaseapp.com",
  databaseURL: "https://ruangkopi-surabaya-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ruangkopi-surabaya",
  storageBucket: "ruangkopi-surabaya.firebasestorage.app",
  messagingSenderId: "878252848574",
  appId: "1:878252848574:web:50a9557f4cc91cf75a35ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;