# Event Management System - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Or on Windows, simply double-click `start.bat`

### 3. Access the Application
Open your browser and go to: **http://localhost:3000**

## Features Overview

### For Users:
- ✅ Browse events in a beautiful card-based layout
- ✅ View detailed event information
- ✅ Register for events with name, email, and phone
- ✅ See registration status and availability

### For Administrators:
- ✅ Create new events with all details
- ✅ Automatic time overlap detection
- ✅ Delete events
- ✅ View all events in admin panel

## Creating Your First Event

1. Click on the "Admin" button in the navigation
2. Fill in the event form:
   - **Event ID**: Unique identifier (e.g., E001)
   - **Event Name**: Name of the event
   - **Description**: Optional description
   - **Start Date & End Date**: Event dates
   - **Start Time & End Time**: Event times
   - **Venue**: Optional venue location
   - **Max Participants**: Optional participant limit
3. Click "Create Event"
4. The system will automatically check for time overlaps

## Testing Time Overlap Prevention

Try creating two events with overlapping times:
- Event 1: Dec 15, 2024, 10:00 AM - 2:00 PM
- Event 2: Dec 15, 2024, 1:00 PM - 5:00 PM

The system will reject Event 2 because it overlaps with Event 1.

## Database

The database file (`events.db`) is automatically created when you first run the server. It stores:
- Events information
- User registrations

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can change it in `server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to another port
```

### Database Issues
If you encounter database issues, delete the `events.db` file and restart the server. A new database will be created automatically.

## API Endpoints

- `GET /api/events` - Get all events
- `GET /api/events/:eventId` - Get single event
- `POST /api/events` - Create event
- `POST /api/events/:eventId/register` - Register for event
- `DELETE /api/events/:eventId` - Delete event

## Support

For issues or questions, refer to the main README.md file.

