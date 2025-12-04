// Script.js - CSV Parsing and Data Models

// ============ DATA MODELS ============

/**
 * Event Model
 */
class Event {
  constructor(id, name, description, event_date, event_time, location, max_registrations = 100) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.event_date = event_date;
    this.event_time = event_time;
    this.location = location;
    this.max_registrations = max_registrations;
  }

  toString() {
    return `Event: ${this.name} on ${this.event_date} at ${this.event_time}`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      event_date: this.event_date,
      event_time: this.event_time,
      location: this.location,
      max_registrations: this.max_registrations,
    };
  }
}

/**
 * Task Model
 */
class Task {
  constructor(id, title, description, dueDate, priority = "medium", status = "pending") {
    this.id = id;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
    this.status = status;
  }

  isOverdue() {
    const today = new Date();
    return new Date(this.dueDate) < today && this.status !== "completed";
  }

  toString() {
    return `${this.title} (${this.priority}) - ${this.status}`;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      dueDate: this.dueDate,
      priority: this.priority,
      status: this.status,
    };
  }
}

// ============ CSV UTILITIES ============

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText, hasHeader = true) {
  const lines = csvText.trim().split("\n");
  const result = [];

  if (lines.length === 0) return result;

  let headers = [];
  let startIndex = 0;

  if (hasHeader) {
    headers = lines[0].split(",").map((h) => h.trim());
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(",").map((v) => v.trim());
    const obj = {};

    if (hasHeader) {
      headers.forEach((header, index) => {
        obj[header.toLowerCase()] = values[index] || "";
      });
    } else {
      obj.values = values;
    }

    result.push(obj);
  }

  return result;
}

/**
 * Convert array of objects to CSV
 */
function convertToCSV(data, headers = null) {
  if (!data || data.length === 0) return "";

  const actualHeaders = headers || Object.keys(data[0]);
  let csv = actualHeaders.join(",") + "\n";

  data.forEach((row) => {
    const values = actualHeaders.map((header) => {
      const value = row[header] || "";
      return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
    });
    csv += values.join(",") + "\n";
  });

  return csv;
}

/**
 * Download CSV file
 */
function downloadCSV(data, filename = "export.csv", headers = null) {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Export events as CSV
 */
function exportEventsAsCSV(events) {
  const headers = ["id", "name", "description", "event_date", "event_time", "location"];
  downloadCSV(events, "events-export.csv", headers);
}

/**
 * Export tasks as CSV
 */
function exportTasksAsCSV(tasks) {
  const headers = ["id", "title", "description", "dueDate", "priority", "status"];
  downloadCSV(tasks, "tasks-export.csv", headers);
}

/**
 * Validate CSV data
 */
function validateCSV(data, requiredFields = []) {
  const errors = [];

  if (!data || data.length === 0) {
    errors.push("CSV data is empty");
    return { valid: false, errors };
  }

  data.forEach((row, index) => {
    requiredFields.forEach((field) => {
      if (!row[field] || row[field].trim() === "") {
        errors.push(`Row ${index + 1}: Missing required field '${field}'`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

/**
 * Import events from CSV
 */
function importEventsFromCSV(csvText) {
  const data = parseCSV(csvText, true);
  const requiredFields = ["name", "event_date", "event_time", "location"];

  const validation = validateCSV(data, requiredFields);
  if (!validation.valid) {
    console.error("CSV Validation failed:", validation.errors);
    return null;
  }

  return data.map(
    (row) =>
      new Event(
        row.id || Date.now(),
        row.name,
        row.description,
        row.event_date,
        row.event_time,
        row.location,
        row.max_registrations || 100
      )
  );
}

/**
 * Import tasks from CSV
 */
function importTasksFromCSV(csvText) {
  const data = parseCSV(csvText, true);
  const requiredFields = ["title"];

  const validation = validateCSV(data, requiredFields);
  if (!validation.valid) {
    console.error("CSV Validation failed:", validation.errors);
    return null;
  }

  return data.map(
    (row) =>
      new Task(
        row.id || Date.now(),
        row.title,
        row.description,
        row.duedate,
        row.priority || "medium",
        row.status || "pending"
      )
  );
}
