/* firebase-init.js
   Connects this site to your Firebase project and exposes just the Firestore
   functions marketplace.js needs, on window.FB.

   1. Go to console.firebase.google.com > your project (Carandang-Hub) > gear icon
      > Project settings > scroll to "Your apps" > click the web app (</>) >
      copy the firebaseConfig object shown there.
   2. Paste it over the placeholder object below.
   3. In the Firebase console, go to Firestore Database > Rules and use the rules
      from firestore.rules.txt in this project (or your own), then click Publish.

   This file is loaded as a <script type="module">, so it runs *after* the page's
   classic scripts (like marketplace.js) have finished executing. marketplace.js
   waits for the "firebase-ready" event below before it touches window.FB, so the
   order in index.html doesn't matter as long as both script tags are present.
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
  onSnapshot, query, orderBy, where, arrayUnion, arrayRemove, writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

var firebaseConfig = {
  apiKey: "AIzaSyBdPoASb2O8eq7dCtEbTUcHPGLLHssUUZM",
  authDomain: "carandang-hub.firebaseapp.com",
  projectId: "carandang-hub",
  storageBucket: "carandang-hub.firebasestorage.app",
  messagingSenderId: "792178824933",
  appId: "1:792178824933:web:af4f16b665b3211a61a60c"
};
var ADMIN_UID = "hmCNDi9OSGRO5gXrzYHEpopB6WD2";

var app = initializeApp(firebaseConfig);
var db = getFirestore(app);
var auth = getAuth(app);

window.FB = {
  auth: auth,
  adminUid: ADMIN_UID,
  createUserWithEmailAndPassword: createUserWithEmailAndPassword,
  signInWithEmailAndPassword: signInWithEmailAndPassword,
  signOut: signOut,
  onAuthStateChanged: onAuthStateChanged,
  db: db,
  collection: collection, doc: doc, addDoc: addDoc, updateDoc: updateDoc, deleteDoc: deleteDoc, setDoc: setDoc,
  onSnapshot: onSnapshot, query: query, orderBy: orderBy, where: where,
  arrayUnion: arrayUnion, arrayRemove: arrayRemove, writeBatch: writeBatch
};
window.dispatchEvent(new Event('firebase-ready'));

onAuthStateChanged(auth, function (user) {
  window.dispatchEvent(new CustomEvent('hub-auth-changed', {
    detail: {
      username: user ? user.email.split('@')[0] : '',
      isAdmin: !!user && user.uid === ADMIN_UID
    }
  }));
});
