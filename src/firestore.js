import firebase from "@firebase/app"
import "@firebase/firestore"

const config = {
    apiKey: "AIzaSyAf8PlgCRbgKVeY_77hUycwFj0RzHOjlkg",
    authDomain: "mysurance-e3685.firebaseapp.com",
    databaseURL: "https://mysurance-e3685.firebaseio.com",
    projectId: "mysurance-e3685",
    storageBucket: "mysurance-e3685.appspot.com",
    messagingSenderId: "109618932023"
}

const app = firebase.initializeApp(config)
const firestore = firebase.firestore(app)

export default firestore

