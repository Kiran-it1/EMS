// Events Module - For Event Management Pages

let eventsList = [];
let currentFilter = "all";

// Load events on page initialization
async function initializeEventsPage() {
  loadEventsList();
  setupEventFilters();
}

// Load all events from API
async function loadEventsList() {
  const container = document.getElementById("events-container");
  if (!container) return;

  container.innerHTML = '<div class="loading">Loading events...</div>';

  try {
    const response = await fetch("/api/events");
    if (!response.ok) throw new Error("Failed to load events");

    eventsList = await response.json();

    if (eventsList.length === 0) {
      container.innerHTML = '<p class="no-events">No events available</p>';
      return;
    }

    displayEvents(eventsList);
  } catch (error) {
    container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

// Display events in the container
function displayEvents(eventsToDisplay) {
  const container = document.getElementById("events-container");
  if (!container) return;

  if (eventsToDisplay.length === 0) {
    container.innerHTML = '<p class="no-events">No events found</p>';
    return;
  }

  const html = eventsToDisplay
    .map(
      (event) => `
    <div class="event-item" data-event-id="${event.id}">
      <h3>${event.name}</h3>
      <p class="date"><strong>Date:</strong> ${new Date(
        event.event_date
      ).toLocaleDateString()}</p>
      <p class="time"><strong>Time:</strong> ${event.event_time}</p>
      <p class="location"><strong>Location:</strong> ${event.location}</p>
      <p class="description">${event.description}</p>
      <button class="btn btn-info" onclick="viewEventDetails(${event.id})">View Details</button>
      <button class="btn btn-primary" onclick="registerForEvent(${event.id})">Register</button>
    </div>
  `
    )
    .join("");

  container.innerHTML = html;
  attachEventListeners();
}

// View event details
async function viewEventDetails(eventId) {
  try {
    const response = await fetch(`/api/events/${eventId}`);
    if (!response.ok) throw new Error("Event not found");

    const event = await response.json();

    const regResponse = await fetch(
      `/api/events/${eventId}/registrations/count`
    );
    const regCount = (await regResponse.json()).count || 0;

    const modal = document.getElementById("event-details-modal");
    const content = document.getElementById("event-details-content");

    if (modal && content) {
      content.innerHTML = `
        <h2>${event.name}</h2>
        <div class="event-details">
          <p><strong>Date:</strong> ${new Date(
            event.event_date
          ).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${event.event_time}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Max Registrations:</strong> ${event.max_registrations}</p>
          <p><strong>Current Registrations:</strong> ${regCount}</p>
          <p><strong>Description:</strong> ${event.description}</p>
        </div>
      `;
      modal.classList.add("active");
    } else {
      alert(`
Event: ${event.name}
Date: ${new Date(event.event_date).toLocaleDateString()}
Time: ${event.event_time}
Location: ${event.location}
Registered: ${regCount}

${event.description}
      `);
    }
  } catch (error) {
    alert("Error loading event details: " + error.message);
  }
}

// Register for event
async function registerForEvent(eventId) {
  const name = prompt("Enter your name:");
  if (!name) return;

  const email = prompt("Enter your email:");
  if (!email) return;

  const phone = prompt("Enter your phone number:");
  if (!phone) return;

  try {
    const response = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Registration failed");

    alert("Successfully registered for the event!");
    loadEventsList();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Setup event filters
function setupEventFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      applyEventFilter();
    });
  });
}

// Apply filter to events
function applyEventFilter() {
  let filtered = eventsList;

  if (currentFilter === "upcoming") {
    const today = new Date();
    filtered = eventsList.filter((e) => new Date(e.event_date) >= today);
  } else if (currentFilter === "past") {
    const today = new Date();
    filtered = eventsList.filter((e) => new Date(e.event_date) < today);
  }

  displayEvents(filtered);
}

// Attach click listeners to event items
function attachEventListeners() {
  document.querySelectorAll(".event-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (!e.target.classList.contains("btn")) {
        viewEventDetails(item.dataset.eventId);
      }
    });
  });
}

// Search events by name
function searchEvents(query) {
  const filtered = eventsList.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase())
  );
  displayEvents(filtered);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initializeEventsPage);
