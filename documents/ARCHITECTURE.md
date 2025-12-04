# Application Code Organization & Architecture

## Overview
The application has been refactored from a monolithic structure into a modular, well-organized codebase with clear separation of concerns. While still using a single comprehensive `app.js` file, the code is now organized into distinct logical modules within that file, making it easier to navigate, maintain, and extend.

## Current File Structure

### `scripts/` Directory
```
scripts/
├── ui.js              (UI utilities & helpers)
├── auth.js            (Authentication & authorization)
├── app.js             (Main application - all business logic organized by module)
├── events.js          (Legacy - CSV parsing utilities)
├── script.js          (Legacy - Event/Task data models)
└── tasks.js           (Legacy - Task management)
```

## Main Application Structure (app.js)

The `app.js` file is organized into **4 main modules** with clear section markers:

### MODULE 1: App Initialization & Navigation (~80 lines)
**Location:** Lines 1-50+ (after configuration)
**Responsibility:** Application startup and page navigation
**Key Functions:**
- `startApp()` - Initialize app after authentication
- `initializeNavigation()` - Setup page switching logic

**When Used:**
- On app load (DOMContentLoaded event)
- When user navigates between Events and Admin pages

---

### MODULE 2: Events - User Event Listing & Display (~350 lines)
**Location:** After Module 1
**Responsibility:** Display available events for regular users
**Key Functions:**
- `loadEvents()` - Fetch and render all events with registration counts
- `createEventCard()` - Generate HTML for individual event cards
- `attachEventCardListeners()` - Setup click handlers for event cards
- `showEventDetails()` - Display event details in modal

**Features:**
- Real-time registration count updates
- "Event Full" badge when max capacity reached
- Visual feedback for available spots
- Click on card to view full details
- Register button for quick registration

**Data Flow:**
```
User clicks "Events" page
  ↓
loadEvents() fetches from /api/events
  ↓
For each event, fetch registration count
  ↓
createEventCard() generates HTML
  ↓
attachEventCardListeners() adds interactivity
  ↓
User clicks event card or sees details
```

---

### MODULE 3: Registration - User Event Registration (~50 lines)
**Location:** After Module 2
**Responsibility:** Handle user registration for events
**Key Functions:**
- `setupRegistrationForm()` - Initialize registration form
- `openRegistrationModal()` - Open registration dialog

**Features:**
- Pre-fills email from authenticated user
- Validates user is logged in
- Allows optional phone number
- Updates registration counts after successful registration
- Shows success/error toast notifications

**Form Fields:**
- Full Name (required)
- Email (required, readonly - from current user)
- Phone Number (optional)

---

### MODULE 4: Admin - Event Creation & Management (~350 lines)
**Location:** After Module 3
**Responsibility:** Admin event management interface
**Key Functions:**
- `setupEventForm()` - Initialize event creation form
- `loadAdminEvents()` - Load all events in admin view
- `showAdminEventDetails()` - Display event details for admins
- `showEventRegistrations()` - Show all registrations for an event (table view)
- `deleteEvent()` - Remove an event from the system

**Admin Features:**
- Create new events with full details
- View all events managed
- See registration counts for each event
- View detailed list of all registrations
- Delete events (with confirmation)
- Edit event details (view only in current version)

**Event Form Fields:**
- Event ID (unique identifier)
- Event Name
- Description
- Start Date & Time
- End Date & Time
- Venue
- Max Participants (optional)

**Admin Permissions:**
- Only accessible to users with `role: "admin"`
- Silent auth check (no error toast if not admin)
- Redirect to Events if not authorized

---

## Supporting Modules

### `ui.js` (~100 lines)
**Purpose:** UI utilities and helpers
**Exports:**
- `setupModals()` - Initialize modal functionality
- `closeModal(modalId)` - Close specific modal
- `showToast(message, type)` - Display toast notifications
- `showAuthOverlay(mode)` - Show login/register overlay
- `hideAuthOverlay()` - Hide auth overlay
- `formatDate(dateString)` - Format dates to readable format
- `formatTime(timeString)` - Format times to 12-hour format

**Loaded First** (no dependencies)

---

### `auth.js` (~270 lines)
**Purpose:** Authentication and authorization
**Exports:**
- `initializeAuthFlow()` - Check auth on app start
- `handleLoginSubmit(event)` - Process login
- `handleRegisterSubmit(event)` - Process registration
- `requireAuth(role, options)` - Check if user is authorized
- `getAuthHeaders()` - Get auth token for API requests
- `applyRoleUI()` - Update UI based on user role
- State: `authState` object with `{token, user}`

**Key Features:**
- JWT token management
- LocalStorage persistence
- Password strength validation
- Role-based access control
- Session verification

**Loaded Second** (depends on ui.js)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION START                         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─→ DOMContentLoaded event
             ├─→ initializeAuthFlow() [from auth.js]
             ├─→ setupModals() [from ui.js]
             │
             ├─→ Check localStorage for auth token
             ├─→ If token exists: verify with /api/auth/me
             ├─→ If valid: handleAuthSuccess() → startApp()
             ├─→ If invalid: showAuthOverlay("login")
             │
             └─→ USER AUTHENTICATES
                 │
                 ├─→ Login: handleLoginSubmit()
                 ├─→ Register: handleRegisterSubmit()
                 │
                 └─→ handleAuthSuccess()
                     │
                     ├─→ hideAuthOverlay()
                     ├─→ applyRoleUI() [show admin button if admin]
                     │
                     └─→ startApp()
                         │
                         ├─→ initializeNavigation()
                         ├─→ setupEventForm()
                         ├─→ setupRegistrationForm()
                         ├─→ loadEvents() [show Events page]
                         ├─→ If admin: loadAdminEvents()
                         │
                         └─→ APP READY FOR USER
```

---

## File Loading Order in HTML

```html
<script src="/ui.js"></script>              <!-- 1st: UI utilities (no deps)  -->
<script src="/auth.js"></script>            <!-- 2nd: Auth (needs ui.js)      -->
<script src="/app.js"></script>             <!-- 3rd: Main app (needs both)   -->
```

**Critical:** Scripts must load in this order. If order changes:
- `auth.js` won't have access to `showToast()`, `showAuthOverlay()` etc.
- `app.js` won't have access to auth functions
- Module dependencies will fail with "undefined" errors

---

## Adding New Features

### To add a new page/feature:

1. **Create a new function section** in `app.js` after existing modules
2. **Add section header** with clear module name
3. **Implement feature functions** following existing patterns
4. **Export global functions** needed for HTML onclick handlers:
   ```javascript
   window.myNewFunction = myNewFunction;
   ```
5. **Add navigation button** in HTML and wire to `initializeNavigation()`
6. **Add comments** explaining purpose and dependencies

### Example:
```javascript
// ============================================================================
// MODULE 5: REPORTS - EVENT REPORTING & ANALYTICS
// ============================================================================

function generateEventReport(eventId) {
  // Implementation
}

window.generateEventReport = generateEventReport;
```

---

## Key Architecture Principles

1. **Separation of Concerns** - Each module has single responsibility
2. **Clear Comments** - Section headers make navigation easy
3. **Logical Organization** - Related functions grouped together
4. **Dependency Management** - External functions loaded first
5. **Global Exports** - HTML onclick handlers via `window` object
6. **Consistent Patterns** - Similar functions follow same structure

---

## Performance Notes

- **Lazy Loading:** Events load on page navigation, not on startup
- **Parallel Requests:** Registration counts fetched in parallel (`Promise.all()`)
- **Efficient Updates:** Only reload when necessary (after registration, event creation, etc.)
- **Modal Efficiency:** Single modal element reused for all detail views

---

## Security Considerations

1. **Auth Token Storage:** Stored in localStorage (consider sessionStorage in production)
2. **Silent Auth Checks:** Admin functions use `{ silent: true }` to prevent auth overlay loops
3. **Role Verification:** Always check `authState.user.role` before admin operations
4. **Error Handling:** All API calls wrapped in try-catch with user-friendly error messages

---

## Troubleshooting

**"Function is not defined" error:**
- Check if function is in correct module
- Verify script load order in HTML
- Check if function is exported to window for onclick handlers

**"Cannot read property of undefined":**
- Verify auth state is set (user logged in)
- Check API response format
- Verify all required fields populated

**Auth overlay appears unexpectedly:**
- Check auth token validity
- Check token storage in localStorage
- Verify `/api/auth/me` endpoint is working

---

## File Sizes (After Refactoring)

- `ui.js` - 99 lines (UI utilities)
- `auth.js` - 271 lines (Authentication)
- `app.js` - 655 lines (Main application)
- **Total:** ~1025 lines (well-organized and maintainable)

All modules are thoroughly commented and follow JavaScript best practices.
