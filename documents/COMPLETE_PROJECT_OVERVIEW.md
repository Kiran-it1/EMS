# Complete Project Overview - Event Management System

## 📋 Table of Contents
1. [Project Summary](#project-summary)
2. [Data Storage Overview](#data-storage-overview)
3. [System Architecture](#system-architecture)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Function-by-Function Breakdown](#function-by-function-breakdown)
6. [File Structure](#file-structure)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [User Roles & Permissions](#user-roles--permissions)

---

## Project Summary

This is a **full-stack Event Management System** built with Node.js, Express, and SQLite. The system allows:
- **Users** to browse events and register as participants
- **Admins** to create, update, and delete events
- **Automatic time overlap prevention** to avoid scheduling conflicts
- **Participant registration tracking** with capacity management

---

## Data Storage Overview

### Primary Storage Location
**All data is stored in a single SQLite database file:**
- **File**: `events.db`
- **Location**: Root directory of the project
- **Type**: SQLite3 database
- **Connection**: Established in `server.js` (line 23)

### Database Tables

The database contains **3 main tables**:

#### 1. **users** Table
Stores all user accounts (both regular users and admins).

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `email` | TEXT | Unique email address (used for login) |
| `password` | TEXT | Hashed password (bcrypt) |
| `role` | TEXT | Either 'user' or 'admin' |
| `created_at` | DATETIME | Account creation timestamp (auto) |

**When data is stored:**
- User registration: `POST /api/auth/register`
- Location: `server.js` lines 185-225

---

#### 2. **events** Table
Stores all event information created by admins.

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `event_id` | TEXT | Unique event identifier (e.g., "EVT001") |
| `event_name` | TEXT | Name of the event |
| `description` | TEXT | Event description (optional) |
| `start_date` | TEXT | Start date (YYYY-MM-DD) |
| `end_date` | TEXT | End date (YYYY-MM-DD) |
| `start_time` | TEXT | Start time (HH:MM) |
| `end_time` | TEXT | End time (HH:MM) |
| `venue` | TEXT | Event location (optional) |
| `max_participants` | INTEGER | Maximum participants (optional) |
| `created_at` | DATETIME | Event creation timestamp (auto) |

**When data is stored:**
- Event creation: `POST /api/events` (Admin only)
- Location: `server.js` lines 295-373

---

#### 3. **registrations** Table
Stores participant registration details when users register for events.

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `event_id` | TEXT | Foreign key to events table |
| `user_name` | TEXT | Participant's name |
| `user_email` | TEXT | Participant's email (from logged-in user) |
| `user_phone` | TEXT | Participant's phone number (optional) |
| `registration_date` | DATETIME | Registration timestamp (auto) |

**When data is stored:**
- Event registration: `POST /api/events/:eventId/register` (User only)
- Location: `server.js` lines 467-554
- **This is where participant details are stored after event registration**

---

## System Architecture

```
┌─────────────────┐
│   Frontend      │
│  (public/)      │
│  - index.html   │
│  - app.js       │
│  - style.css    │
└────────┬────────┘
         │ HTTP Requests
         │ (REST API)
         ▼
┌─────────────────┐
│   Backend       │
│  (server.js)     │
│  - Express      │
│  - JWT Auth     │
│  - Validation   │
└────────┬────────┘
         │ SQL Queries
         ▼
┌─────────────────┐
│   Database      │
│  (events.db)    │
│  - users        │
│  - events       │
│  - registrations│
└─────────────────┘
```

---

## Data Flow Diagrams

### User Registration Flow
```
User Input → POST /api/auth/register
    ↓
Validate Password
    ↓
Hash Password (bcrypt)
    ↓
INSERT INTO users (email, password, role, created_at)
    ↓
Response: Success
```

### Event Creation Flow
```
Admin Input → POST /api/events
    ↓
Validate Dates/Times
    ↓
Check Time Overlap
    ↓
INSERT INTO events (all fields)
    ↓
Response: Event Created
```

### Event Registration Flow (Participant Details Storage)
```
User Clicks Register → POST /api/events/:eventId/register
    ↓
Check Event Exists (SELECT FROM events)
    ↓
Check Already Registered (SELECT FROM registrations)
    ↓
Check Max Participants (COUNT FROM registrations)
    ↓
INSERT INTO registrations (event_id, user_name, user_email, user_phone, registration_date)
    ↓
✅ PARTICIPANT DETAILS STORED IN registrations TABLE
    ↓
Response: Registration Successful
```

---

## Function-by-Function Breakdown

### Authentication Functions

#### 1. User Registration
- **Endpoint**: `POST /api/auth/register`
- **File**: `server.js` lines 185-225
- **Data Stored**: `users` table
- **Fields**: email, password (hashed), role, created_at

#### 2. User Login
- **Endpoint**: `POST /api/auth/login`
- **File**: `server.js` lines 227-260
- **Data Accessed**: `users` table (read-only)
- **Returns**: JWT token

#### 3. Get Current User
- **Endpoint**: `GET /api/auth/me`
- **File**: `server.js` lines 262-264
- **Data Accessed**: JWT token (no database query)

---

### Event Management Functions

#### 4. Get All Events
- **Endpoint**: `GET /api/events`
- **File**: `server.js` lines 267-278
- **Data Accessed**: `events` table (read-only)
- **Returns**: Array of all events

#### 5. Get Single Event
- **Endpoint**: `GET /api/events/:eventId`
- **File**: `server.js` lines 281-292
- **Data Accessed**: `events` table (read-only)
- **Returns**: Single event details

#### 6. Create Event (Admin Only)
- **Endpoint**: `POST /api/events`
- **File**: `server.js` lines 295-373
- **Data Stored**: `events` table
- **Validation**: Time overlap check, date ordering

#### 7. Update Event (Admin Only)
- **Endpoint**: `PUT /api/events/:eventId`
- **File**: `server.js` lines 376-445
- **Data Updated**: `events` table
- **Validation**: Time overlap check (excluding current event)

#### 8. Delete Event (Admin Only)
- **Endpoint**: `DELETE /api/events/:eventId`
- **File**: `server.js` lines 448-464
- **Data Deleted**: Row from `events` table

---

### Registration Functions

#### 9. Register for Event (User Only)
- **Endpoint**: `POST /api/events/:eventId/register`
- **File**: `server.js` lines 467-554
- **Data Stored**: `registrations` table
- **Fields Stored**: event_id, user_name, user_email, user_phone, registration_date
- **Validation**: 
  - Event exists
  - User not already registered
  - Max participants not reached

#### 10. Get Event Registrations (Admin Only)
- **Endpoint**: `GET /api/events/:eventId/registrations`
- **File**: `server.js` lines 557-575
- **Data Accessed**: `registrations` table (read-only)
- **Returns**: All participants for the event

#### 11. Get Registration Count
- **Endpoint**: `GET /api/events/:eventId/registrations/count`
- **File**: `server.js` lines 578-591
- **Data Accessed**: `registrations` table (read-only)
- **Returns**: Count of participants

---

## File Structure

```
Mini-project/
├── events.db                    ← ALL DATA STORED HERE
├── server.js                    ← Backend server & database operations
├── package.json                 ← Dependencies
├── package-lock.json            ← Locked dependencies
│
├── public/                      ← Frontend files
│   ├── index.html              ← Main UI
│   ├── css/
│   │   └── style.css           ← Styling
│   └── js/
│       └── app.js              ← Frontend logic & API calls
│
├── Event-Management/            ← Original CSV-based system (separate)
│   ├── index.html
│   ├── events.html
│   ├── tasks.html
│   └── ...
│
├── DATA_STORAGE.md             ← Detailed data storage documentation
├── COMPLETE_PROJECT_OVERVIEW.md ← This file
├── PROJECT_STRUCTURE.md        ← Project structure guide
├── README.md                   ← Main documentation
└── SETUP.md                    ← Setup instructions
```

---

## Database Schema

### Relationships

```
users (1) ──┐
             │
             │ (user_email)
             │
events (1) ──┼──> registrations (many)
             │
             │ (event_id - Foreign Key)
```

### Table Details

**users**
- Primary Key: `id`
- Unique: `email`
- Indexes: email (for fast login lookup)

**events**
- Primary Key: `id`
- Unique: `event_id`
- Indexes: event_id (for fast event lookup)

**registrations**
- Primary Key: `id`
- Foreign Key: `event_id` → `events.event_id`
- Indexes: event_id, user_email (for fast queries)

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/auth/register` | Register new user | No | - |
| POST | `/api/auth/login` | Login user | No | - |
| GET | `/api/auth/me` | Get current user | Yes | Any |

### Events
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/events` | Get all events | No | - |
| GET | `/api/events/:eventId` | Get single event | No | - |
| POST | `/api/events` | Create event | Yes | Admin |
| PUT | `/api/events/:eventId` | Update event | Yes | Admin |
| DELETE | `/api/events/:eventId` | Delete event | Yes | Admin |

### Registrations
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/events/:eventId/register` | Register for event | Yes | User |
| GET | `/api/events/:eventId/registrations` | Get registrations | Yes | Admin |
| GET | `/api/events/:eventId/registrations/count` | Get count | No | - |

---

## User Roles & Permissions

### Regular User (`role: 'user'`)
**Can:**
- ✅ Register account
- ✅ Login
- ✅ View all events
- ✅ Register for events (participant)
- ✅ View own registrations

**Cannot:**
- ❌ Create events
- ❌ Update events
- ❌ Delete events
- ❌ View all registrations for events

### Administrator (`role: 'admin'`)
**Can:**
- ✅ Register account
- ✅ Login
- ✅ View all events
- ✅ Create events
- ✅ Update events
- ✅ Delete events
- ✅ View all registrations for any event
- ✅ View registration counts

**Cannot:**
- ❌ Register as participant for events (admin role restriction)

---

## Complete Data Flow Example

### Scenario: Complete User Journey

1. **User Registration**
   ```
   User → POST /api/auth/register
   → Data stored in users table:
     - email: "john@example.com"
     - password: "$2b$10$hashed..."
     - role: "user"
     - created_at: "2025-11-20 10:00:00"
   ```

2. **User Login**
   ```
   User → POST /api/auth/login
   → System reads from users table
   → Returns JWT token
   ```

3. **Admin Creates Event**
   ```
   Admin → POST /api/events
   → Data stored in events table:
     - event_id: "EVT001"
     - event_name: "Tech Conference"
     - start_date: "2025-12-01"
     - end_date: "2025-12-01"
     - start_time: "09:00"
     - end_time: "17:00"
     - venue: "Convention Center"
     - max_participants: 100
     - created_at: "2025-11-20 10:30:00"
   ```

4. **User Views Events**
   ```
   User → GET /api/events
   → System reads from events table
   → Returns all events
   ```

5. **User Registers for Event**
   ```
   User → POST /api/events/EVT001/register
   → System checks events table (event exists?)
   → System checks registrations table (already registered?)
   → System checks registrations table (max participants?)
   → Data stored in registrations table:
     - event_id: "EVT001"
     - user_name: "John Doe"
     - user_email: "john@example.com"
     - user_phone: "1234567890"
     - registration_date: "2025-11-20 11:00:00"
   ✅ PARTICIPANT DETAILS STORED
   ```

6. **Admin Views Registrations**
   ```
   Admin → GET /api/events/EVT001/registrations
   → System reads from registrations table
   → Returns all participants for EVT001
   ```

---

## Key Takeaways

1. **Single Database File**: All data is stored in `events.db` (SQLite)
2. **Three Main Tables**: `users`, `events`, `registrations`
3. **Participant Details**: Stored in `registrations` table after event registration
4. **Automatic Timestamps**: `created_at` and `registration_date` are auto-generated
5. **Security**: Passwords are hashed with bcrypt before storage
6. **Relationships**: Foreign key links `registrations.event_id` to `events.event_id`
7. **Email Linking**: `registrations.user_email` links to `users.email`

---

## Quick Reference

### Where is data stored?
- **All data**: `events.db` (SQLite database)
- **Users/Admins**: `users` table
- **Events**: `events` table
- **Participant Registrations**: `registrations` table

### When is participant data stored?
- **After event registration**: When user calls `POST /api/events/:eventId/register`
- **Location**: `registrations` table
- **Fields**: event_id, user_name, user_email, user_phone, registration_date

### How to view data?
1. Use SQLite command line: `sqlite3 events.db`
2. Use database browser tool
3. Use API endpoints to get JSON data

---

## Documentation Files

- **DATA_STORAGE.md**: Detailed data storage documentation
- **COMPLETE_PROJECT_OVERVIEW.md**: This file (complete overview)
- **PROJECT_STRUCTURE.md**: Project structure guide
- **README.md**: Main project documentation
- **SETUP.md**: Setup instructions

---

**Last Updated**: November 2025
**Version**: 1.0.0





1] add eye icon inlogin and register to show password

2] in event registration time format should be 12 hrs format with am and pm

3]while event creation add dedline for registereing time and date. after that date and time, register button should be un available, and display with red color dedline closed

4]for user or pasrticipant first in event card only event name has to be displayed, once the user cliciks on that card, then all content details has to be displayed and also registration button everything has to be displayed

5] each event card should have announcements button once he clcik on that, new page should open, in that anouncements related to that event has to be shown. anouncements will be done by admin

6]each event card should have querry button. once he clicks that new page should open, he should write his query and and click submit. it will be displayed in admin section

7]in admin no need to show events page as he is not going to register for those events

8]in admin section in event creation page dont display created events and its details button and all. that we will display in other page. ini creation page just creating form has to be displayed

8] admin should have event dashboard page, in that page event cards should be present, once he clicks on one event card its all details has to be displayed and all buttons like view registration and delete event and edit details, if he clicks edit he can change any detail regarding that event

9]admin event card also has anoiuncement button where he will type announcements and click anounce or submit this will be showed in users anouncement section users can only see anouncement they cannot reply in anouncements they will post in querries section

10]admin event card also has querries button once he clicks that it should show queries card posted by users, in their queries section. once he click on querry card it will display name of the person posted that querry and he can reply their for that querry and that reply should be updated in user querries