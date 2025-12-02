# SAME

A rapid-fire prediction game where you guess what the majority chose.

## The Concept

**SAME** presents binary questions (A vs B) and challenges you to predict which option most people selected.

- **Correct Guess:** Screen flashes "SAME" (Green). +1 Point.
- **Incorrect Guess:** Screen flashes "NOPE" (Red). 0 Points.
- **The Economy:** Answering earns Points. Asking a question costs 3 Points.

## Tech Stack

- **Frontend:** React Native (Expo) with TypeScript
- **Styling:** NativeWind (TailwindCSS)
- **Backend:** Firebase (Firestore + Anonymous Auth)
- **Animations:** React Native Reanimated
- **State:** Zustand

## Setup

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase project

### 2. Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Anonymous Authentication**:
   - Go to Authentication → Sign-in method → Anonymous → Enable
3. Create a **Firestore Database**:
   - Go to Firestore Database → Create database → Start in test mode
4. Get your Firebase config:
   - Go to Project Settings → General → Your apps → Add app (Web)
   - Copy the config values

### 3. Environment Variables

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Seed the Database

Populate the database with starter questions:

```bash
npm run seed
```

### 6. Run the App

```bash
# Start Expo dev server
npm start

# Or run on specific platform
npm run ios
npm run android
npm run web
```

## Firestore Security Rules

For production, update your Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Questions are readable by all authenticated users
    // Only creatable via transactions (enforced by app logic)
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Votes are readable/writable by the owner
    match /votes/{voteId} {
      allow read, write: if request.auth != null && 
        voteId.matches(request.auth.uid + '_.*');
    }
  }
}
```

## Project Structure

```
SAME/
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   └── index.tsx       # Main feed screen
│   ├── _layout.tsx         # Root layout
│   └── create-question.tsx # Question creation modal
├── components/
│   ├── CreateQuestionModal.tsx
│   ├── QuestionCard.tsx
│   ├── ScoreHeader.tsx
│   └── VoteButtons.tsx
├── hooks/
│   ├── useAuth.ts          # Firebase auth
│   ├── useCreateQuestion.ts
│   ├── useQuestions.ts     # Paginated feed
│   └── useVote.ts          # Voting logic
├── lib/
│   ├── firebase.ts         # Firebase config
│   └── firestore.ts        # Database helpers
├── types/
│   └── index.ts            # TypeScript types
└── scripts/
    └── seed.ts             # Database seeder
```

## Key Features

### Voting Logic

The "SAME" algorithm uses strict comparison (`>` not `>=`) to handle ties correctly:

```typescript
// For user picking Option A:
const userWins = (currentA + 1) > currentB;

// For user picking Option B:
const userWins = (currentB + 1) > currentA;
```

This ensures "first to break tie wins" behavior.

### Firestore Cost Optimization

- **Cursor-based pagination:** Uses `limit(20)` + `startAfter()` instead of listening to entire collection
- **Filtered queries:** Only fetches questions the user hasn't voted on
- **Offline persistence:** Reduces reads with local caching

### Abuse Prevention

- Daily creation limit: 5 questions per day
- Score requirement: 3 points to create a question
- Atomic transactions: Prevents cheating the economy

## License

MIT

