// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHaiRVMug-oIs9uaKmaJYyRP9Yus1jFeg",
  authDomain: "kitchenmaster-73e91.firebaseapp.com",
  projectId: "kitchenmaster-73e91",
  storageBucket: "kitchenmaster-73e91.firebasestorage.app",
  messagingSenderId: "454405501374",
  appId: "1:454405501374:web:3d74e9ac7e3fffb3b009ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
// Initialize Firebase Authentication and get a reference to the service
// export const auth = getAuth(app);