# Firebase Setup Instructions

Follow these steps to set up Firebase for your Doodle Bliss Kennel application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `doodle-bliss-kennel` (or your preferred name)
4. Click "Continue"
5. Disable Google Analytics (optional) or configure it
6. Click "Create project"
7. Wait for the project to be created, then click "Continue"

## Step 2: Register Your Web App

1. In the Firebase Console, click the **web icon** (`</>`) to add a web app
2. Enter app nickname: `Breeder App`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the Firebase configuration** - you'll need this in Step 4

The config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

## Step 3: Enable Authentication Methods

### Email/Password Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on "Email/Password"
3. Toggle "Enable"
4. Click "Save"

### Google Authentication
1. In **Sign-in method**, click on "Google"
2. Toggle "Enable"
3. Select a support email
4. Click "Save"

### Facebook Authentication
1. First, create a Facebook App:
   - Go to [Facebook for Developers](https://developers.facebook.com/)
   - Create a new app
   - Add "Facebook Login" product
   - In Settings → Basic, copy your **App ID** and **App Secret**

2. Back in Firebase Console, click on "Facebook"
3. Toggle "Enable"
4. Paste your Facebook **App ID** and **App Secret**
5. Copy the **OAuth redirect URI** from Firebase
6. Go back to your Facebook App Settings → Facebook Login → Settings
7. Paste the OAuth redirect URI in "Valid OAuth Redirect URIs"
8. Click "Save Changes" in both Facebook and Firebase

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Select "Start in **production mode**" (we'll set up rules next)
4. Choose a Cloud Firestore location (pick one close to your users)
5. Click "Enable"

### Set Up Security Rules

1. Go to **Firestore Database** → **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Dogs collection - users can only read/write their own dogs
    match /dogs/{dogId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
    }

    // Litters collection - users can only read/write their own litters
    match /litters/{litterId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
    }
  }
}
```

3. Click "Publish"

## Step 5: Set Up Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click "Get started"
3. Click "Next" to use the default security rules
4. Click "Done"

### Set Up Storage Security Rules

1. Go to **Storage** → **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Step 6: Update Your Environment Variables

1. Open the file `.env.local` in your project root
2. Replace the placeholder values with your actual Firebase config from Step 2:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. **IMPORTANT**: Restart your development server:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

## Step 7: Test Your Setup

1. Go to http://localhost:5174/signup
2. Create a new account with email/password
3. Or try "Sign in with Google" or "Sign in with Facebook"
4. Once logged in, try adding a dog
5. Check your Firestore console to see the data appear!

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure you've enabled the authentication method in Firebase Console
- Check that your `.env.local` file has the correct values
- Restart your dev server after changing `.env.local`

### Facebook login not working
- Double-check that the OAuth redirect URI is correctly set in Facebook App Settings
- Make sure your Facebook App is not in Development Mode (or add test users)
- Check that App ID and App Secret are correct in Firebase

### Data not saving to Firestore
- Check your Firestore security rules
- Make sure the user is logged in
- Check browser console for errors

### Photos not uploading
- Check your Storage security rules
- Make sure the user is authenticated
- Check browser console for errors

## Next Steps

Your Firebase integration is complete! You now have:
- ✅ User authentication (Email, Google, Facebook)
- ✅ Firestore database for storing dogs and litters
- ✅ Firebase Storage for dog photos
- ✅ Secure, user-specific data access

Each user can only see and manage their own dogs - perfect for a multi-user breeder application!
