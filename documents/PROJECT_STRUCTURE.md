# Project Structure Guide

This repository contains **TWO** event management systems:

## 1. Original Event-Management System (CSV-Based)

**Location**: `Event-Management/` folder

**Type**: Frontend-only (HTML/CSS/JavaScript)

**Features**:
- CSV file upload for events and tasks
- Browser localStorage for data storage
- Event and task management
- Overlap detection

**How to Run**:
- Simply open `Event-Management/index.html` in a web browser
- No server or installation required

**Files**:
```
Event-Management/
├── index.html
├── events.html
├── tasks.html
├── css/
├── scripts/
└── README.md
```

---

## 2. New Full-Stack Event Management System

**Location**: Root directory (`/`)

**Type**: Full-stack (Node.js + Express + SQLite)

**Features**:
- Modern web interface with event cards
- User registration system
- RESTful API
- SQLite database
- Time overlap prevention
- Admin panel

**How to Run**:
```bash
npm install
npm start
```
Then open: http://localhost:3000

**Files**:
```
/
├── server.js              # Backend server
├── package.json           # Dependencies
├── public/                # Frontend files
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── events.db              # Database (auto-created)
└── README.md              # Main documentation
```

---

## Which One to Use?

### Use Original (Event-Management/) if:
- You want a simple CSV-based system
- No server setup needed
- Quick and easy to use
- Data stored in browser

### Use New System (Root) if:
- You want a full-stack application
- Need database persistence
- Want user registration
- Need a professional web application
- Want RESTful API

---

## Both Projects Are Complete!

- ✅ Original CSV-based system is restored in `Event-Management/`
- ✅ New full-stack system is in root directory
- ✅ Both can be used independently
- ✅ All files are present and working

---

## Quick Start

### Original System:
1. Open `Event-Management/index.html` in browser
2. Upload CSV files
3. Done!

### New System:
1. Run `npm install`
2. Run `npm start`
3. Open http://localhost:3000
4. Create events and register users!

---

**Both projects are ready to use!** 🎉

