import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

// Read Firebase config from src/lib/firebase.ts or process.env (not available easily outside)
