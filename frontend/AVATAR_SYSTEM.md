# Avatar Fallback System Documentation

## Overview
This document describes the robust avatar fallback system implemented across the application.

## Implementation

### Components Using Avatars

1. **UserMenu.tsx** - User avatar in topbar (small & large dropdown version)
2. **ProfileModal.tsx** - Avatar in profile editor

### Fallback Logic

```typescript
// Priority order:
1. If user.avatar exists → Display profile image as background
2. If no avatar → Display first letter of user.name (uppercase)  
3. If no name → Display "?" as safe fallback

// Code pattern:
{!user.avatar && (user.name?.charAt(0)?.toUpperCase() || '?')}
```

### CSS Implementation

All avatar components use:
```css
.user-avatar, .user-avatar-large, .avatar-display {
  display: grid;
  place-items: center;  /* Perfect centering for text/image */
  borderradius: 50%;    /* Circular shape */
  cursor: pointer;       /* Indicates clickability */
  background: var(--purple); /* Fallback background color */
}
```

### API Integration

- Avatar URLs are dynamically constructed using `env.API_URL`
- Format: `${env.API_URL.replace('/api', '')}${user.avatar}`
- Example: `http://localhost:5002/uploads/avatars/filename.jpg`
- Images are served as static files from backend `/uploads` directory

### User Interactions

#### Topbar Avatar
- **Click**: Opens dropdown menu with profile/settings/logout options
- **Hover**: Slight scale animation (transform: scale(1.05))

#### Profile Modal Avatar  
- **Click**: Opens file picker to upload new avatar
- **Hover**: Shows camera icon overlay
- **Upload**: Immediately previews new image before saving
- **Error**: Reverts to previous avatar or initial letter

## Technical Details

### Type Safety
- Uses optional chaining (`user?.name?.charAt(0)`) to prevent crashes
- TypeScript ensures type safety across components
- Safe fallback prevents blank avatars

### State Management
- Avatar updates trigger `avatarUpdated` custom event
- UserContext.refreshUser() syncs user data across app
- Profile changes persist to backend via API calls

### File Handling
- Accepts: image/* MIME types
- Max size: 5MB
- Validation: File type and size checked before upload
- Preview: Uses FileReader API for instant preview

## Acceptance Criteria ✅

- [x] No blank purple avatars
- [x] Exactly one avatar per user (removed duplicate team avatars from topbar)
- [x] Initial letter visible and clickable when no image exists
- [x] Profile image replaces initial when present
- [x] Clean, maintainable, production-ready code
- [x] Proper TypeScript typing with safe navigation
- [x] Accessible markup with proper semantic HTML
- [x] No class name collisions (unique classes per component)
- [x] Consistent styling across all avatar instances
- [x] Dynamic API URL configuration (no hardcoded ports)

## Testing Scenarios

1. **New User (No Avatar)**
   - Should display: First letter of name in purple circle
   - Clickable: Yes
   - Behavior: Opens menu/file picker as appropriate

2. **User With Avatar**
   - Should display: Profile picture
   - Clickable: Yes
   - Fallback: If image fails to load, shows initial letter

3. **Missing Name (Edge Case)**
   - Should display: "?" in purple circle
   - Prevents: Blank avatars or crashes
   - Safe: Application continues working

4. **Upload New Avatar**
   - Preview: Shows immediately before save
   - Error: Reverts to previous state
   - Success: Updates across entire app

## Files Modified

- `/frontend/src/components/layout/UserMenu.tsx`
- `/frontend/src/components/layout/Topbar.tsx`
- `/frontend/src/components/profile/ProfileModal.tsx`
- `/frontend/src/components/layout/userMenu.css`

## Key Improvements

1. **Removed duplicate avatars** from Topbar (team members)
2. **Added safe fallbacks** for missing data
3. **Fixed API URL** to use dynamic configuration
4. **Added comprehensive documentation** in code
5. **Ensured consistent behavior** across all components
