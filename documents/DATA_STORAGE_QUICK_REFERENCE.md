# Data Storage Quick Reference

## 🗄️ Where is Data Stored?

**All data is stored in ONE file:**
- **File**: `events.db`
- **Type**: SQLite Database
- **Location**: Root directory (`/events.db`)

---

## 📊 Database Tables

### 1. **users** Table
**Stores**: User accounts (both users and admins)

| Field | Description |
|-------|-------------|
| `id` | Auto-increment ID |
| `email` | User email (unique) |
| `password` | Hashed password |
| `role` | 'user' or 'admin' |
| `created_at` | Account creation time |

**When stored**: User registration (`POST /api/auth/register`)

---

### 2. **events** Table
**Stores**: All event information

| Field | Description |
|-------|-------------|
| `id` | Auto-increment ID |
| `event_id` | Unique event ID (e.g., "EVT001") |
| `event_name` | Event name |
| `description` | Event description |
| `start_date` | Start date (YYYY-MM-DD) |
| `end_date` | End date (YYYY-MM-DD) |
| `start_time` | Start time (HH:MM) |
| `end_time` | End time (HH:MM) |
| `venue` | Event location |
| `max_participants` | Maximum participants |
| `created_at` | Event creation time |

**When stored**: Admin creates event (`POST /api/events`)

---

### 3. **registrations** Table ⭐
**Stores**: Participant details when users register for events

| Field | Description |
|-------|-------------|
| `id` | Auto-increment ID |
| `event_id` | Event being registered for |
| `user_name` | Participant's name |
| `user_email` | Participant's email |
| `user_phone` | Participant's phone |
| `registration_date` | Registration timestamp |

**When stored**: User registers for event (`POST /api/events/:eventId/register`)

**⭐ This is where participant details are stored after event registration!**

---

## 🔄 Data Flow Summary

```
1. User Registration
   → Stored in: users table
   → Fields: email, password (hashed), role

2. Admin Creates Event
   → Stored in: events table
   → Fields: event_id, event_name, dates, times, venue, etc.

3. User Registers for Event
   → Stored in: registrations table
   → Fields: event_id, user_name, user_email, user_phone, registration_date
   → ✅ PARTICIPANT DETAILS STORED HERE
```

---

## 📍 File Locations

```
Project Root/
├── events.db              ← ALL DATA STORED HERE
├── server.js             ← Database operations
└── public/
    └── js/
        └── app.js        ← Frontend API calls
```

---

## 🔍 Quick Commands

### View Database Contents
```bash
# Open SQLite database
sqlite3 events.db

# View all tables
.tables

# View users
SELECT * FROM users;

# View events
SELECT * FROM events;

# View registrations (participant details)
SELECT * FROM registrations;
```

---

## ✅ Summary

- **All data**: `events.db` (SQLite database)
- **Users/Admins**: `users` table
- **Events**: `events` table
- **Participant Details**: `registrations` table (stored after event registration)

---

For detailed documentation, see:
- `DATA_STORAGE.md` - Complete data storage documentation
- `COMPLETE_PROJECT_OVERVIEW.md` - Full project overview

