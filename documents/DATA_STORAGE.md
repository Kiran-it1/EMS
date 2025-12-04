# Data Storage Documentation

## Overview

All data in the Event Management System is stored in a **SQLite database** file named `events.db` located in the root directory of the project.

---

## Database Location

- **File**: `events.db`
- **Type**: SQLite Database
- **Location**: Root directory (`/events.db`)
- **Connection**: Established in `server.js` (line 23)

---

## Database Tables

The database contains **3 main tables**:

### 1. **users** Table

Stores all registered user accounts (both regular users and admins).

**Schema:**

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Fields:**

- `id`: Unique identifier (auto-increment)
- `email`: User's email address (unique, used for login)
- `password`: Hashed password (using bcrypt)
- `role`: Either 'user' or 'admin'
- `created_at`: Timestamp when account was created

**Data Flow:**

- **When**: User registers via `/api/auth/register`
- **Stored**: Email, hashed password, role
- **Location**: `server.js` lines 185-225

---

### 2. **events** Table

Stores all event information created by admins.

**Schema:**

```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    event_name TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    venue TEXT,
    max_participants INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Fields:**

- `id`: Unique identifier (auto-increment)
- `event_id`: Unique event identifier (e.g., "EVT001")
- `event_name`: Name of the event
- `description`: Event description (optional)
- `start_date`: Event start date (YYYY-MM-DD format)
- `end_date`: Event end date (YYYY-MM-DD format)
- `start_time`: Event start time (HH:MM format)
- `end_time`: Event end time (HH:MM format)
- `venue`: Event location (optional)
- `max_participants`: Maximum number of participants (optional)
- `created_at`: Timestamp when event was created

**Data Flow:**

- **When**: Admin creates event via `/api/events` (POST)
- **Stored**: All event details including dates, times, venue, max participants
- **Location**: `server.js` lines 295-373
- **Validation**: Checks for time overlaps and date ordering

---

### 3. **registrations** Table

Stores participant registration details when users register for events.

**Schema:**

```sql
CREATE TABLE registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
)
```

**Fields:**

- `id`: Unique identifier (auto-increment)
- `event_id`: References the event being registered for
- `user_name`: Participant's name
- `user_email`: Participant's email (from logged-in user)
- `user_phone`: Participant's phone number (optional)
- `registration_date`: Timestamp when registration occurred

**Data Flow:**

- **When**: User registers for an event via `/api/events/:eventId/register` (POST)
- **Stored**: Event ID, user name, user email, phone number, registration timestamp
- **Location**: `server.js` lines 467-554
- **Validation**:
  - Checks if event exists
  - Checks if user already registered
  - Checks if event has reached max participants

---

## Data Flow by Function

### 1. User Registration (`/api/auth/register`)

**Function**: Register a new user account

**Process:**

1. User submits email, password, and role
2. Password is validated (min 8 chars, special character required)
3. Password is hashed using bcrypt
4. Data is inserted into `users` table
5. Response: Success message

**Data Stored:**

- Table: `users`
- Fields: `email`, `password` (hashed), `role`, `created_at` (auto)

---

### 2. User Login (`/api/auth/login`)

**Function**: Authenticate user and generate JWT token

**Process:**

1. User submits email and password
2. System queries `users` table for matching email
3. Password is compared with stored hash
4. If valid, JWT token is generated
5. Response: Token and user info

**Data Accessed:**

- Table: `users`
- Fields: `email`, `password` (for comparison)

**Data Stored:**

- No data stored (read-only operation)

---

### 3. Create Event (`/api/events` POST)

**Function**: Admin creates a new event

**Process:**

1. Admin submits event details
2. System validates dates and times
3. System checks for time overlaps with existing events
4. Data is inserted into `events` table
5. Response: Event ID and success message

**Data Stored:**

- Table: `events`
- Fields: `event_id`, `event_name`, `description`, `start_date`, `end_date`, `start_time`, `end_time`, `venue`, `max_participants`, `created_at` (auto)

**Data Accessed:**

- Table: `events` (to check for overlaps)

---

### 4. Register for Event (`/api/events/:eventId/register`)

**Function**: User registers as participant for an event

**Process:**

1. User submits name and phone (email from auth token)
2. System checks if event exists in `events` table
3. System checks if user already registered in `registrations` table
4. System checks if event has reached max participants
5. Data is inserted into `registrations` table
6. Response: Registration ID and success message

**Data Stored:**

- Table: `registrations`
- Fields: `event_id`, `user_name`, `user_email`, `user_phone`, `registration_date` (auto)

**Data Accessed:**

- Table: `events` (to verify event exists and check max participants)
- Table: `registrations` (to check existing registrations and count)

---

### 5. Get Events (`/api/events` GET)

**Function**: Retrieve all events

**Process:**

1. System queries `events` table
2. Results are sorted by start_date and start_time
3. Response: Array of all events

**Data Accessed:**

- Table: `events`
- Fields: All fields

**Data Stored:**

- No data stored (read-only operation)

---

### 6. Get Event Registrations (`/api/events/:eventId/registrations`)

**Function**: Admin views all registrations for an event

**Process:**

1. Admin requests registrations for specific event
2. System queries `registrations` table filtered by event_id
3. Results are sorted by registration_date (newest first)
4. Response: Array of registrations

**Data Accessed:**

- Table: `registrations`
- Fields: All fields for matching event_id

**Data Stored:**

- No data stored (read-only operation)

---

### 7. Get Registration Count (`/api/events/:eventId/registrations/count`)

**Function**: Get count of participants for an event

**Process:**

1. System queries `registrations` table
2. Counts rows matching event_id
3. Response: Count number

**Data Accessed:**

- Table: `registrations`
- Fields: Count of rows

**Data Stored:**

- No data stored (read-only operation)

---

### 8. Update Event (`/api/events/:eventId` PUT)

**Function**: Admin updates event details

**Process:**

1. Admin submits updated event details
2. System validates dates and times
3. System checks for time overlaps (excluding current event)
4. Data is updated in `events` table
5. Response: Success message

**Data Stored:**

- Table: `events`
- Fields: All fields except `event_id` and `created_at`

**Data Accessed:**

- Table: `events` (to check for overlaps)

---

### 9. Delete Event (`/api/events/:eventId` DELETE)

**Function**: Admin deletes an event

**Process:**

1. System deletes event from `events` table
2. Note: Related registrations may remain (cascade behavior depends on DB setup)
3. Response: Success message

**Data Stored:**

- Table: `events`
- Action: Row deleted

---

## Complete Data Flow Example

### Scenario: User Registers for an Event

1. **User Account Creation** (if not exists):

   - User registers: `POST /api/auth/register`
   - Data stored in `users` table:
     ```
     email: "user@example.com"
     password: "$2b$10$hashed..." (bcrypt hash)
     role: "user"
     created_at: "2025-11-20 10:00:00"
     ```

2. **User Login**:

   - User logs in: `POST /api/auth/login`
   - System reads from `users` table
   - Returns JWT token

3. **Admin Creates Event** (if not exists):

   - Admin creates event: `POST /api/events`
   - Data stored in `events` table:
     ```
     event_id: "EVT001"
     event_name: "Tech Conference"
     start_date: "2025-12-01"
     end_date: "2025-12-01"
     start_time: "09:00"
     end_time: "17:00"
     venue: "Convention Center"
     max_participants: 100
     created_at: "2025-11-20 10:30:00"
     ```

4. **User Registers for Event**:

   - User registers: `POST /api/events/EVT001/register`
   - System checks `events` table (event exists? max participants?)
   - System checks `registrations` table (already registered?)
   - Data stored in `registrations` table:
     ```
     event_id: "EVT001"
     user_name: "John Doe"
     user_email: "user@example.com"
     user_phone: "1234567890"
     registration_date: "2025-11-20 11:00:00"
     ```

5. **Admin Views Registrations**:
   - Admin requests: `GET /api/events/EVT001/registrations`
   - System reads from `registrations` table
   - Returns all participants for that event

---

## Database Relationships

```
users (1) ──┐
             │
             │ (user_email used in registrations)
             │
events (1) ──┼──> registrations (many)
             │
             │ (event_id foreign key)
```

- **users** ↔ **registrations**: Linked by `user_email`
- **events** ↔ **registrations**: Linked by `event_id` (foreign key)

---

## File Structure Summary

```
Project Root/
├── events.db              ← ALL DATA STORED HERE (SQLite Database)
├── server.js             ← Backend logic (database operations)
├── public/
│   ├── index.html        ← Frontend UI
│   └── js/
│       └── app.js        ← Frontend API calls
└── DATA_STORAGE.md       ← This documentation file
```

---

## Key Points

1. **Single Source of Truth**: All data is stored in `events.db` SQLite database
2. **Three Main Tables**: `users`, `events`, `registrations`
3. **Automatic Timestamps**: `created_at` and `registration_date` are auto-generated
4. **Password Security**: Passwords are hashed using bcrypt before storage
5. **Foreign Key Relationship**: `registrations.event_id` references `events.event_id`
6. **Email Linking**: `registrations.user_email` links to `users.email`

---

## Viewing Database Contents

To view the database contents, you can:

1. **Use SQLite Command Line**:

   ```bash
   sqlite3 events.db
   .tables                    # List all tables
   SELECT * FROM users;       # View users
   SELECT * FROM events;      # View events
   SELECT * FROM registrations; # View registrations
   ```

2. **Use Database Browser**: Open `events.db` with SQLite Browser or similar tool

3. **Use API Endpoints**: Query the REST API endpoints to get data in JSON format

---

## Summary

- **All data** is stored in `events.db` (SQLite database)
- **Users/Admins** → stored in `users` table
- **Events** → stored in `events` table
- **Participant Registrations** → stored in `registrations` table
- **After event registration**, participant details are automatically stored in the `registrations` table with timestamp

The system ensures data integrity through:

- Foreign key constraints
- Unique constraints (email, event_id)
- Validation checks before insertion
- Automatic timestamp generation
