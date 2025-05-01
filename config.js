import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyByT4A26ibE-L35_yBXPqQcJAAycsHfs1A",
    authDomain: "testjoy-2958c.firebaseapp.com",
    projectId: "testjoy-2958c",
    storageBucket: "testjoy-2958c.appspot.com",
    messagingSenderId: "1013945106894",
    appId: "1:1013945106894:web:75b21f6534c21786786b9f",
    measurementId: "G-QM2Y6ZN8SX"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);