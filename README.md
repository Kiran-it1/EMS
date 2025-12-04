# Event Management System

A professional, full-stack event management system that allows users to browse events visually and register for them. The system ensures no time overlaps between events and provides a complete admin interface for event management.

## Features

### User Features
- 🎯 **Visual Event Display**: Browse events in an attractive card-based grid layout
- 📅 **Event Details**: View detailed information about each event
- ✅ **Event Registration**: Register for events with name, email, and phone
- 🔍 **Event Search**: Easy navigation and filtering of events
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### Admin Features
- ➕ **Create Events**: Add new events with all necessary details
- 🗑️ **Delete Events**: Remove events from the system
- ⏰ **Time Overlap Prevention**: Automatic validation to prevent scheduling conflicts
- 👥 **Participant Management**: Set maximum participants for events
- 📊 **Registration Tracking**: View registration counts for each event

### Technical Features
- ⚡ **RESTful API**: Clean, well-structured backend API
- 💾 **SQLite Database**: Lightweight, file-based database
- 🎨 **Modern UI**: Beautiful, professional interface with smooth animations
- 🔒 **Data Validation**: Comprehensive validation on both client and server
- 🚫 **Overlap Detection**: Intelligent time overlap detection algorithm

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Styling**: Custom CSS with CSS Variables

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Steps

1. **Clone or download the project**
   ```bash
   cd miniprojectnew
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Open your browser and navigate to: `http://localhost:3000`
   - The application will be ready to use!

## Usage

### For Users

1. **Browse Events**
   - On the home page, you'll see all available events displayed as cards
   - Each card shows event name, date, time, venue, and other details

2. **View Event Details**
   - Click on any event card to see full details
   - View description, dates, times, venue, and participant information

3. **Register for an Event**
   - Click the "Register" button on any event card
   - Fill in your name, email, and optional phone number
   - Submit the registration form
   - You'll receive a confirmation message

### For Administrators

1. **Navigate to Admin Panel**
   - Click the "Admin" button in the navigation bar

2. **Create an Event**
   - Fill in the event form with:
     - Event ID (unique identifier)
     - Event Name
     - Description (optional)
     - Start Date and End Date
     - Start Time and End Time
     - Venue (optional)
     - Maximum Participants (optional)
   - Click "Create Event"
   - The system will automatically check for time overlaps

3. **Manage Events**
   - View all created events in the admin panel
   - Delete events if needed

## API Endpoints

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:eventId` - Get single event
- `POST /api/events` - Create new event
- `PUT /api/events/:eventId` - Update event
- `DELETE /api/events/:eventId` - Delete event

### Registrations
- `POST /api/events/:eventId/register` - Register for event
- `GET /api/events/:eventId/registrations` - Get all registrations for event
- `GET /api/events/:eventId/registrations/count` - Get registration count

## Database Schema

### Events Table
- `id` - Primary key
- `event_id` - Unique event identifier
- `event_name` - Name of the event
- `description` - Event description
- `start_date` - Start date (YYYY-MM-DD)
- `end_date` - End date (YYYY-MM-DD)
- `start_time` - Start time (HH:MM)
- `end_time` - End time (HH:MM)
- `venue` - Event venue
- `max_participants` - Maximum number of participants
- `created_at` - Timestamp

### Registrations Table
- `id` - Primary key
- `event_id` - Foreign key to events
- `user_name` - Registrant's name
- `user_email` - Registrant's email
- `user_phone` - Registrant's phone (optional)
- `registration_date` - Timestamp

## Time Overlap Detection

The system uses an intelligent algorithm to detect time overlaps:

1. **Date Range Overlap**: Checks if event date ranges overlap
2. **Time Overlap**: For events on the same date, checks if time ranges overlap
3. **Boundary Cases**: Handles events that start/end on the same date with overlapping times

Events cannot be created if they overlap with existing events in the system.

## Project Structure

```
event-management-system/
├── server.js              # Backend server and API
├── package.json           # Dependencies and scripts
├── events.db              # SQLite database (created automatically)
├── public/                # Frontend files
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── style.css      # Stylesheet
│   └── js/
│       └── app.js         # Frontend JavaScript
└── README.md              # This file
```

## Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon to automatically restart the server on file changes.

### Adding Sample Events

You can use the admin panel to add events, or use API calls:

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "E001",
    "event_name": "Tech Conference 2024",
    "description": "Annual technology conference",
    "start_date": "2024-12-15",
    "end_date": "2024-12-15",
    "start_time": "09:00",
    "end_time": "17:00",
    "venue": "Convention Center",
    "max_participants": 100
  }'
```

## Error Handling

The system includes comprehensive error handling:
- Validation errors for missing fields
- Time overlap detection
- Duplicate event ID prevention
- Duplicate registration prevention
- Event capacity checking
- User-friendly error messages

## Future Enhancements

Potential improvements for the system:
- User authentication and accounts
- Email notifications for registrations
- Event categories and tags
- Advanced search and filtering
- Calendar view
- Export registrations to CSV
- Event reminders
- Payment integration

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please create an issue in the project repository.

---

**Enjoy managing your events! 🎉**

