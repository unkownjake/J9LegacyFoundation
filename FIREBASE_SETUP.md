# Firebase Admin SDK Setup

This project now uses Firebase Admin SDK for server-side operations while keeping authentication client-side.

## Setup Steps

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`j9-website-44747`)
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file

### 2. Set Environment Variable

Add the service account key to your `.env.local` file:

```bash
# Option 1: Direct JSON content (recommended for development)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"j9-website-44747",...}'

# Option 2: Path to file (alternative)
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./path/to/serviceAccountKey.json
```

### 3. Firebase Security Rules

Update your Firestore and Storage security rules to allow server-side operations:

#### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Or more restrictive rules
    match /tests/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write for authenticated users
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }

    // Or more restrictive rules
    match /tests/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## API Endpoints

### Firestore APIs

- `GET /api/firestore/collections` - Get documents from a collection
- `GET /api/firestore/document` - Get a specific document
- `POST /api/firestore/write` - Create/update documents

### Storage APIs

- `POST /api/storage/upload` - Upload files to Firebase Storage
- `GET /api/storage/url` - Get signed URLs for files

## Client Usage

Use the utility functions in `lib/firebase-api.ts`:

```typescript
import { createDocument, getDocument, uploadFile } from "@/lib/firebase-api";

// Create a document
const result = await createDocument("users", { name: "John", age: 30 });

// Get a document
const doc = await getDocument("users", result.id);

// Upload a file
const upload = await uploadFile({
  file: fileInput.files[0],
  path: "users/avatar.jpg",
  metadata: { userId: "123" },
});
```

## Authentication

Authentication remains client-side using the Firebase Auth SDK. The server-side APIs will work with any authenticated user.

## Security Notes

- The service account key has full access to your Firebase project
- Keep it secure and never commit it to version control
- Consider using Application Default Credentials in production
- The Admin SDK bypasses security rules, so implement proper validation in your API routes
