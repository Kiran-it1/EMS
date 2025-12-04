# Running Event Management System in VS Code

## Method 1: Using VS Code Terminal (Recommended)

### Step 1: Open Terminal in VS Code
- Press `Ctrl + `` (backtick) to open the terminal
- Or go to `Terminal` → `New Terminal` from the menu

### Step 2: Install Dependencies (First Time Only)
```bash
npm install
```

### Step 3: Start the Server
```bash
npm start
```

### Step 4: Open in Browser
- The server will start on `http://localhost:3000`
- Press `Ctrl + Click` on the URL in the terminal, or
- Manually open your browser and go to: `http://localhost:3000`

---

## Method 2: Using VS Code Debugger

### Step 1: Install Dependencies (First Time Only)
Open terminal and run:
```bash
npm install
```

### Step 2: Start Debugging
1. Press `F5` or
2. Go to `Run and Debug` (Ctrl+Shift+D) and click the play button
3. Select "Start Event Management Server" from the dropdown

### Step 3: Open in Browser
- Open your browser and go to: `http://localhost:3000`

---

## Method 3: Using VS Code Tasks

### Step 1: Run Install Task
1. Press `Ctrl + Shift + P`
2. Type "Tasks: Run Task"
3. Select "npm: install"

### Step 2: Run Start Task
1. Press `Ctrl + Shift + P`
2. Type "Tasks: Run Task"
3. Select "npm: start"

### Step 3: Open in Browser
- Open your browser and go to: `http://localhost:3000`

---

## Quick Commands Reference

### Terminal Commands:
```bash
# Install dependencies (first time only)
npm install

# Start the server
npm start

# Stop the server
Press Ctrl + C in the terminal
```

### VS Code Shortcuts:
- `Ctrl + `` - Open/Close Terminal
- `F5` - Start Debugging
- `Ctrl + Shift + D` - Open Debug Panel
- `Ctrl + Shift + P` - Command Palette

---

## Troubleshooting

### Port Already in Use
If you see an error that port 3000 is already in use:
1. Stop any other server running on port 3000
2. Or change the port in `server.js`:
   ```javascript
   const PORT = process.env.PORT || 3001; // Change to 3001 or another port
   ```

### Module Not Found Error
Run this command to install dependencies:
```bash
npm install
```

### Database Issues
If you see database errors:
1. Delete the `events.db` file
2. Restart the server (a new database will be created automatically)

---

## Running in Background

To run the server in the background:
1. Open a new terminal in VS Code
2. Run `npm start`
3. The server will continue running in that terminal
4. You can continue working in other terminals

---

## Opening the Application

Once the server is running:
1. Look for the message: "Server is running on http://localhost:3000"
2. Click the URL in the terminal (Ctrl + Click)
3. Or manually open your browser and navigate to: `http://localhost:3000`

---

## Stopping the Server

To stop the server:
1. Click on the terminal where the server is running
2. Press `Ctrl + C`
3. The server will stop

---

**Happy Coding! 🚀**

