# Bug Report

## Bug Summary

When clicking the delete button for a pet from the main page, the page doesn't refresh and the pet doesn't disappear from the UI, even though the delete operation appears to complete successfully in the backend.

## Bug Details

### Expected Behavior

1. User clicks the delete button on a pet card
2. Delete confirmation dialog appears
3. User confirms deletion
4. Pet should immediately disappear from the pet list view
5. UI should refresh to show updated pet count and remaining pets
6. If the deleted pet was the active pet, the interface should automatically select another pet

### Actual Behavior

1. User clicks the delete button on a pet card
2. Delete confirmation dialog appears correctly
3. User confirms deletion
4. Pet remains visible in the pet list view
5. Pet count in the footer doesn't update
6. No visual indication that the delete operation was successful
7. Page requires manual refresh or navigation to see the updated state

### Steps to Reproduce

1. Open Paw Diary application
2. Ensure you have at least 2 pets in the main pet list
3. Click on any pet's delete button (trash icon)
4. Confirm deletion in the dialog by clicking "Delete Forever"
5. Observe that the pet card remains visible in the list
6. Check the pet counter at the bottom - it shows the same count as before

### Environment

- **Version**: Latest development version (Tauri 2.x)
- **Platform**: Desktop application (cross-platform issue)
- **Configuration**: Default Paw Diary setup with SQLite database

## Impact Assessment

### Severity

- [x] High - Major functionality broken
- [ ] Critical - System unusable
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users

All users attempting to delete pets from the main interface. This affects the core pet management functionality.

### Affected Features

- **Pet deletion workflow**: Primary delete functionality broken
- **UI state management**: Pet list doesn't refresh after delete operations
- **Pet navigation**: Active pet selection may not update correctly after deletion
- **Data consistency**: UI state becomes inconsistent with backend database state

## Additional Context

### Error Messages

No error messages are displayed to the user. The operation appears to complete silently, but the UI state is not updated.

### Technical Analysis

Based on code investigation:

1. **Backend (Rust/Tauri) - WORKING CORRECTLY**:
   - `delete_pet` command in `src-tauri/src/commands.rs:97-108` properly implements soft delete
   - Database operation in `src-tauri/src/database.rs` correctly sets `is_archived = TRUE`
   - Backend tests confirm delete functionality works as expected

2. **Frontend State Management - ISSUE IDENTIFIED**:
   - `usePets` hook in `src/hooks/usePets.ts:79-94` has conditional logic for state updates
   - Lines 84-88: Only removes from local state if `!includeArchived`, otherwise calls `refetch()`
   - Problem: Main app uses `usePets(false)` (default), but the delete operation may not be properly updating local state

3. **UI Components - DEPENDENT ON STATE**:
   - `App.tsx:157-169` handles delete confirmation and calls `deletePet(pet.id)`
   - `PetCardList.tsx` displays pets filtered by `!pet.is_archived`
   - Components correctly depend on state, but state may not be updating

### Suspected Root Cause

The issue appears to be in the `deletePet` function in `usePets.ts`. The logic assumes that for non-archived views (`!includeArchived`), pets should be removed from local state directly. However, since the backend does soft delete (archiving), the local state filtering may not be working correctly.

**Key lines of concern:**
- `usePets.ts:84-88`: Conditional state update logic
- The `setPets(prev => prev.filter(pet => pet.id !== id))` operation on line 85 should remove the pet from the local state, but it may not be executing or the UI may not be reacting to the state change

### Related Issues

- Pet counter doesn't update (depends on filtered pet array length)
- Active pet selection logic may not handle deleted pets correctly
- No visual feedback to confirm successful deletion

## Initial Analysis

### Investigation Summary

The bug investigation reveals a disconnect between successful backend operations and frontend state management. The delete operation completes successfully in the Rust backend with proper database updates, but the React frontend fails to reflect these changes immediately.

### Root Cause

State management issue in the `deletePet` function of the `usePets` hook, where the local state array filtering operation fails to trigger UI re-rendering or the deletion logic is not executing properly for the default non-archived view.

### Affected Code Locations

- **File**: `src/hooks/usePets.ts`
  - **Function/Method**: `deletePet()`
  - **Lines**: `79-94`
  - **Issue**: Conditional state update logic not properly removing deleted pets from UI

- **File**: `src/App.tsx`
  - **Function/Method**: `handleDeletePet()`
  - **Lines**: `157-169`
  - **Issue**: Depends on usePets hook state updates

- **File**: `src/components/pets/PetCardList.tsx`
  - **Function/Method**: Component render logic
  - **Lines**: `69-70, 106-117`
  - **Issue**: Displays pets based on filtered state that may not be updating

### Dependencies

- React state management and re-rendering cycle
- Tauri invoke system for frontend-backend communication
- SQLite database with soft delete implementation
