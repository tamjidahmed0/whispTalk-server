import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';



// Get the current file path from import.meta.url
const __filename = fileURLToPath(import.meta.url);
// Get the directory path
const __dirname = path.dirname(__filename);

const serviceAccount = path.join(__dirname, 'firebase-admin.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),  // Using the service account
  storageBucket: 'test-6c839.appspot.com',       // Set your Firebase Storage bucket name here
});

// Firebase storage reference
const bucket = admin.storage().bucket();

export { bucket };  // Export the Firebase bucket reference to use in your upload handler
