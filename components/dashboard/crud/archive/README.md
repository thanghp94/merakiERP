# StudentsTabCrud Archive

This directory contains outdated versions of the StudentsTabCrud component that have been archived to maintain a clean codebase.

## Archived Files

### StudentsTabCrud_backup.tsx
- **Status**: Outdated backup version
- **Reason for archiving**: Missing modern features like ESC key handling, near full-screen modals, and enhanced drawer components
- **Date archived**: December 2024

### StudentsTabCrud_refactored.tsx
- **Status**: Intermediate refactored version
- **Reason for archiving**: Partially updated but missing final enhancements present in the main file
- **Date archived**: December 2024

### StudentsTabCrud_complete.tsx
- **Status**: Near-complete version but outdated
- **Reason for archiving**: Missing latest features like ESC key integration and optimized modal sizing
- **Date archived**: December 2024

## Current Active File

The main `StudentsTabCrud.tsx` file (in the parent directory) is the **most up-to-date version** and includes:

✅ **Modern Features:**
- ESC key handler integration (`useEscapeKey` hook)
- Near full-screen modal support (`maxWidth="near-full"`)
- 3-column optimized layout (`FormGrid columns={3}`)
- Enhanced drawer components with ESC key support
- Invoice detail drawer integration
- Student attendance/tuition viewing functionality
- Advanced filtering and custom actions

## Recovery Instructions

If you need to reference or restore any of these archived files:

1. **To view an archived file:**
   ```bash
   cat components/dashboard/crud/archive/[filename]
   ```

2. **To restore an archived file (not recommended):**
   ```bash
   cp components/dashboard/crud/archive/[filename] components/dashboard/crud/
   ```

3. **To permanently delete archived files:**
   ```bash
   rm components/dashboard/crud/archive/[filename]
   ```

## Notes

- The main `StudentsTabCrud.tsx` file should be used for all development
- These archived files are kept for reference only
- Consider deleting these files after confirming the main file works correctly in production
