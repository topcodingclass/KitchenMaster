// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
//My config
// const firebaseConfig = {
//   apiKey: "AIzaSyBHaiRVMug-oIs9uaKmaJYyRP9Yus1jFeg",
//   authDomain: "kitchenmaster-73e91.firebaseapp.com",
//   projectId: "kitchenmaster-73e91",
//   storageBucket: "kitchenmaster-73e91.firebasestorage.app",
//   messagingSenderId: "454405501374",
//   appId: "1:454405501374:web:3d74e9ac7e3fffb3b009ef"
// };

//Brandon
//brandon@gmail.com 123123
// const firebaseConfig = {
//   apiKey: "AIzaSyDnHVHHBPrGefv2lIk_6zqKnW7pORAY5i4",
//   authDomain: "kitchenmaster-1bbe8.firebaseapp.com",
//   projectId: "kitchenmaster-1bbe8",
//   storageBucket: "kitchenmaster-1bbe8.firebasestorage.app",
//   messagingSenderId: "79363738316",
//   appId: "1:79363738316:web:67eba16c40852398931069"
// };

//Ryan firebase
const firebaseConfig = {
  apiKey: "AIzaSyCqBlPHHaNkYEb1S5WNMqanv3k9IAqmTyk",
  authDomain: "kitchenmaster-5a440.firebaseapp.com",
  projectId: "kitchenmaster-5a440",
  storageBucket: "kitchenmaster-5a440.firebasestorage.app",
  messagingSenderId: "1067021520845",
  appId: "1:1067021520845:web:78412af3baec31cc367e84",
  measurementId: "G-DD45QZVMX7"
};

//Albert
// const firebaseConfig = {
//   apiKey: "AIzaSyA7a1vwXw6h8E1xX_hGORsRAOJ801O96tc",
//   authDomain: "kitchenmaster-2f935.firebaseapp.com",
//   projectId: "kitchenmaster-2f935",
//   storageBucket: "kitchenmaster-2f935.firebasestorage.app",
//   messagingSenderId: "412879249311",
//   appId: "1:412879249311:web:6c5e399d1f8c55cfb927aa",
//   measurementId: "G-1ZZ4CD5R3L"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);


// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
