# Home Page Firestore Setup

This document explains how to set up the Firestore collections for the home page content management.

## Collections Structure

### 1. `homeHero` Collection

Stores hero section content for the home page.

**Document Structure:**

```typescript
{
  title: string,           // Main headline
  description: string,     // Hero description text
  isActive: boolean,       // Whether this hero is currently active
  order: number,          // Display order (ascending)
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

### 2. `homePageCards` Collection

Stores the homepage card content displayed below the hero section.

**Document Structure:**

```typescript
{
  title: string,           // Card title
  description: string,     // Card description
  icon: string,           // Icon identifier (info, calendar, heart)
  link: string,           // Navigation link
  image: string,          // Card image URL
  verticalPosition: string, // Image positioning (top, center, bottom, or custom %)
  isActive: boolean,       // Whether this card is currently active
  order: number,          // Display order (ascending)
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update timestamp
}
```

## Setup Instructions

### 1. Create Collections

In your Firebase Console:

1. Go to Firestore Database
2. Create the following collections:
   - `homeHero`
   - `homePageCards`

### 2. Add Sample Data

Use the default data from `lib/defaults/homeDefaults.ts` to populate your collections:

```typescript
import { defaultHomePageData } from "@/lib/defaults/homeDefaults";

// Add to homeHero collection
await db.collection("homeHero").add({
  ...defaultHomePageData.hero,
  isActive: true,
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Add to homePageCards collection
defaultHomePageData.homepageCards.forEach(async (card, index) => {
  await db.collection("homePageCards").add({
    ...card,
    isActive: true,
    order: index + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});
```

### 3. Set Up Security Rules

Ensure your Firestore security rules allow read access to these collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to home page content
    match /homeHero/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /homePageCards/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Content Management

### Adding New Content

1. Create a new document in the appropriate collection
2. Set `isActive: true` to make it visible
3. Set `order` to control display position
4. Set `createdAt` and `updatedAt` timestamps

### Updating Content

1. Modify the document fields as needed
2. Update the `updatedAt` timestamp
3. Ensure `isActive` is set correctly

### Removing Content

1. Set `isActive: false` to hide without deleting
2. Or delete the document entirely

## Data Flow

The home page data is fetched using:

```typescript
import { getHomePageData } from "@/app/account";

const { hero, homepageCards } = await getHomePageData();
```

This function:

- Fetches active content from `homeHero` and `homePageCards` collections
- Orders content by the `order` field
- Returns typed data using interfaces from `lib/types/home.ts`
- Handles errors gracefully with fallback to default content

## Fallback Content

If the database fails or returns no data, the page will display default content defined in `lib/defaults/homeDefaults.ts`. This ensures the page always renders even if there are database issues.

## Icon System

The homepage cards use a predefined set of icons:

- `info` - Information icon
- `calendar` - Calendar icon
- `heart` - Heart icon

Icons are mapped using the `getIconComponent()` function in `lib/iconMapper.ts`.

## Type Definitions

The home page uses TypeScript interfaces defined in `lib/types/home.ts`:

```typescript
export interface HomePageCardContent {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  image: string;
  verticalPosition: string;
}

export interface HeroContent {
  title: string;
  description: string;
}
```

## Implementation Notes

- **Server-side data fetching**: Uses `"use server"` directive in `account.tsx`
- **Type safety**: All data is properly typed with TypeScript interfaces
- **Fallback handling**: Graceful degradation when database is unavailable
- **Clean separation**: Data logic separated from UI components
- **Default content**: Organized defaults in dedicated folder structure
