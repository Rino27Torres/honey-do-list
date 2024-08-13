/* === Imports === */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js"; 
import { getAuth,     
         signInWithEmailAndPassword, 
         signOut,
         onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import { getFirestore, 
         collection, 
         addDoc,
         serverTimestamp,
         onSnapshot,
         query,
         where,
         orderBy,
         doc,
         updateDoc,
         deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

/* === Firebase Setup === */
const firebaseConfig = {
  apiKey: "AIzaSyAnrrqAY-kAGf-uUckqjzwwa2yjl-VtTI0",
  authDomain: "honey-do-project-d7212.firebaseapp.com",
  projectId: "honey-do-project-d7212",
  storageBucket: "honey-do-project-d7212.appspot.com",
  messagingSenderId: "1063101950776",
  appId: "1:1063101950776:web:b0143316b7543ed2302fcd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);

const viewLoggedOut = document.getElementById("logged-out-view");
const viewLoggedIn = document.getElementById("logged-in-view");
const loginButton = document.getElementById('login-button');
const signOutButton = document.getElementById('sign-out-button');
const posts = document.getElementById("posts");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const userGreeting = document.getElementById("user-greeting");
const postInput = document.getElementById("post-input");
const postButton = document.getElementById("post-btn");

const collectionName = 'posts';

loginButton.addEventListener('click', authSignInWithEmail);
signOutButton.addEventListener('click', authSignOut);
postButton.addEventListener("click", postButtonPressed);

onAuthStateChanged(auth, (user) => {   //Listens for logged in or out
  if (user) {
    showLoggedInView();
    showUserGreeting(userGreeting, user);
    fetchInRealtimeAndRenderPostsFromDB(user);
  } else {
    showLoggedOutView();
  }
});

async function addPostToDB(postBody, user) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      body: postBody,
      uid: user.uid,
      createdAt: serverTimestamp()
  });
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error(error.message);
  }
}

async function updatePostInDB(docId, newBody) {
  const postRef = doc(db, collectionName, docId);

  await updateDoc(postRef, {
    body: newBody
  });
}

async function deletePostFromDB(docId) {
  await deleteDoc(doc(db, collectionName, docId));
}

function fetchInRealtimeAndRenderPostsFromDB(user) {
  const postRef = collection(db, collectionName);
  
  //Checks uid from the post and compares to logged in user uid
  const q = query(postRef, where("uid", "==", user.uid), 
  orderBy('createdAt', 'desc'));

  onSnapshot(q, (querySnapshot) => {
    clearAll(posts);

    querySnapshot.forEach(doc => {
      renderPost(posts, doc);
    })
  })
}

function renderPost(posts, wholeDoc) {
  const postData = wholeDoc.data();
  const postDiv = document.createElement('div');
  postDiv.className = 'post';

  const headerDiv = document.createElement('div');
  headerDiv.className = 'header';

  const headerDate = document.createElement('h3');
  headerDate.className = 'header-date';
  headerDate.textContent = displayDate(postData.createdAt);
  headerDiv.appendChild(headerDate);

  const postBodyDiv = document.createElement('div');
  postBodyDiv.className = 'body-div';

  const postBody = document.createElement('p');
  postBody.innerHTML = postData.body;
  postBodyDiv.appendChild(postBody);
  postDiv.appendChild(postBodyDiv);

  postDiv.appendChild(headerDiv);
  postDiv.appendChild(createPostFooter(wholeDoc));
  
  posts.appendChild(postDiv);
}

function postButtonPressed() {     //Grabs value fron input
    const postBody = postInput.value   //Puts value in postBody
    const user = auth.currentUser    //Current user logged in
    
    if (postBody) {
        addPostToDB(postBody, user)
        clearInputField(postInput);
    }
}

function showLoggedOutView() {
    hideView(viewLoggedIn);
    showView(viewLoggedOut);
}

function showLoggedInView() {
    hideView(viewLoggedOut);
    showView(viewLoggedIn);
}

function clearAll(element) {
    element.innerHTML = "";
}

function showView(view) {
    view.style.display = "flex";
}

function hideView(view) {
    view.style.display = "none";
}

function authSignInWithEmail() {
  const email = emailInput.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      clearAuthFields();
    })
    .catch((error) => {
      console.error(error.message);
    })
}

function authSignOut() {
  signOut(auth).then(() => {
  }).catch((error) => {
    console.error(error.message);
  });
}

function clearInputField(field) {
	field.value = "";
}

function clearAuthFields() {
	clearInputField(emailInput);
	clearInputField(passwordInput);
}

function showUserGreeting(greeting, user) {
  const displayName = user.displayName;

  if(displayName) {
    greeting.textContent = displayName;
  } else {
    greeting.textContent = 'Welcome Guest!';
  }
}

function displayDate(firebaseDate) {
  if(!firebaseDate) {
    return 'Loading date...';
  }

    const date = firebaseDate.toDate();
    
    const day = date.getDate();
    const year = date.getFullYear();
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];

    let hours = date.getHours();
    let minutes = date.getMinutes();
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;

    return `${day} ${month} ${year} - ${hours}:${minutes}`;
}

function createPostFooter(wholeDoc) {
    const footerDiv = document.createElement("div");
    footerDiv.className = "footer";
    
    footerDiv.appendChild(createPostEditButton(wholeDoc));
    footerDiv.appendChild(createPostDeleteButton(wholeDoc));
    
    return footerDiv;
}

function createPostEditButton(wholeDoc) {
  const postId = wholeDoc.id;
  const postData = wholeDoc.data();

  const button = document.createElement('button');
  button.textContent = 'Edit';
  button.classList.add('edit-color');
  button.addEventListener('click', () => {
      const newBody = prompt('Edit Item', postData.body);

      if(newBody) {
        updatePostInDB(postId, newBody);
      }
  })

  return button;
}

function createPostDeleteButton(wholeDoc) {
  const postId = wholeDoc.id
 
  const button = document.createElement('button')
  button.textContent = 'Delete'
  button.classList.add("delete-color")
  button.addEventListener('click', function() {
      deletePostFromDB(postId);
  })
  return button
}