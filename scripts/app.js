// API Base URL
const API_BASE = "/api";
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/;

// State
let currentEventId = null;
let events = [];
let appInitialized = false;
const authState = {
  token: null,
  user: null,
};

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  initializeAuthFlow();
  setupModals();
});

function initializeAuthFlow() {
  attachAuthListeners();
  const storedToken = localStorage.getItem("authToken");
  const storedUser = localStorage.getItem("authUser");

  if (storedToken && storedUser) {
    authState.token = storedToken;
    try {
      authState.user = JSON.parse(storedUser);
    } catch (error) {
      authState.user = null;
    }
  }

  if (authState.token && authState.user) {
    verifySession().catch(() => {
      clearAuthState();
      showAuthOverlay("login");
    });
  } else {
    showAuthOverlay("login");
  }
}

function attachAuthListeners() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const switchButtons = document.querySelectorAll("[data-switch]");
  const logoutBtn = document.getElementById("logout-btn");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
  }

  switchButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchAuthMode(btn.dataset.switch));
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAuthState();
      applyRoleUI();
      showAuthOverlay("login");
      showToast("Logged out successfully", "success");
    });
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = {
    email: formData.get("login_email").trim(),
    password: formData.get("login_password"),
  };

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to login");
    }

    authState.token = data.token;
    authState.user = data.user;
    saveAuthState();
    event.target.reset();
    handleAuthSuccess("Welcome back!");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = {
    email: formData.get("register_email").trim(),
    password: formData.get("register_password"),
    role: formData.get("register_role"),
  };

  if (!isPasswordStrong(payload.password)) {
    showToast(
      "Password must be 8+ chars and include a special character.",
      "error"
    );
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to register");
    }

    event.target.reset();
    switchAuthMode("login");
    showToast("Registration successful. Please login.", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function verifySession() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Session expired");
  }

  const data = await response.json();
  authState.user = data.user;
  saveAuthState();
  handleAuthSuccess();
}

function handleAuthSuccess(message) {
  hideAuthOverlay();
  applyRoleUI();
  startApp();
  if (message) {
    showToast(message, "success");
  }
}

function switchAuthMode(mode = "login") {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const authTitle = document.getElementById("auth-title");
  const authDescription = document.getElementById("auth-description");

  if (!loginForm || !registerForm) return;

  if (mode === "register") {
    loginForm.classList.remove("active");
    registerForm.classList.add("active");
    authTitle.textContent = "Create account";
    authDescription.textContent = "Register to access your portal";
  } else {
    registerForm.classList.remove("active");
    loginForm.classList.add("active");
    authTitle.textContent = "Welcome Back";
    authDescription.textContent = "Login to continue managing events";
  }
}

function showAuthOverlay(mode = "login") {
  switchAuthMode(mode);
  const overlay = document.getElementById("auth-overlay");
  overlay?.classList.add("active");
}

function hideAuthOverlay() {
  const overlay = document.getElementById("auth-overlay");
  overlay?.classList.remove("active");
}

function saveAuthState() {
  if (authState.token && authState.user) {
    localStorage.setItem("authToken", authState.token);
    localStorage.setItem("authUser", JSON.stringify(authState.user));
  }
}

function clearAuthState() {
  authState.token = null;
  authState.user = null;
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
}

function applyRoleUI() {
  const emailLabel = document.getElementById("auth-email");
  const rolePill = document.getElementById("auth-role-pill");
  const logoutBtn = document.getElementById("logout-btn");
  const adminNavBtn = document.getElementById("admin-nav-btn");
  const eventsNavBtn = document.querySelector('[data-page="events"]');

  if (emailLabel && rolePill) {
    if (authState.user) {
      emailLabel.textContent = authState.user.email;
      rolePill.textContent = authState.user.role === "admin" ? "Admin" : "User";
    } else {
      emailLabel.textContent = "Guest";
      rolePill.textContent = "-";
    }
  }

  if (logoutBtn) {
    logoutBtn.style.display = authState.user ? "inline-flex" : "none";
  }

  if (adminNavBtn) {
    if (authState.user?.role === "admin") {
      adminNavBtn.style.display = "inline-flex";
    } else {
      adminNavBtn.style.display = "none";
      if (eventsNavBtn && !eventsNavBtn.classList.contains("active")) {
        eventsNavBtn.click();
      }
    }
  }

  updateRegistrationEmailField();
}

function startApp() {
  if (!appInitialized) {
    initializeNavigation();
    setupEventForm();
    setupRegistrationForm();
    loadEvents();
    appInitialized = true;
  } else {
    loadEvents();
  }

  if (authState.user?.role === "admin") {
    loadAdminEvents();
  }
}

function getAuthHeaders() {
  if (!authState.token) {
    return {};
  }
  return {
    Authorization: `Bearer ${authState.token}`,
  };
}

function requireAuth(role = null, options = {}) {
  if (!authState.user) {
    if (!options.silent) {
      showToast("Please login to continue", "error");
      showAuthOverlay("login");
    }
    return false;
  }

  if (role && authState.user.role !== role) {
    if (!options.silent) {
      const roleLabel = role === "admin" ? "administrators" : "users";
      showToast(`Only ${roleLabel} can perform this action`, "error");
    }
    return false;
  }

  return true;
}

function updateRegistrationEmailField() {
  const regEmailInput = document.getElementById("reg_email");
  if (!regEmailInput) return;

  if (authState.user) {
    regEmailInput.value = authState.user.email;
  } else {
    regEmailInput.value = "";
  }
}

function isPasswordStrong(password) {
  return (
    typeof password === "string" &&
    password.length >= PASSWORD_MIN_LENGTH &&
    PASSWORD_SPECIAL_REGEX.test(password)
  );
}

// Navigation
function initializeNavigation() {
  const navBtns = document.querySelectorAll(".nav-btn");
  const pages = document.querySelectorAll(".page");

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pageId = btn.dataset.page;

      if (pageId === "admin" && !requireAuth("admin")) {
        return;
      }

      // Update active nav button
      navBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update active page
      pages.forEach((p) => p.classList.remove("active"));
      document.getElementById(`${pageId}-page`).classList.add("active");

      // Reload events if going to events page
      if (pageId === "events") {
        loadEvents();
      } else if (pageId === "admin") {
        loadAdminEvents();
      }
    });
  });
}

// Load events for events page
async function loadEvents() {
  const eventsGrid = document.getElementById("events-grid");
  eventsGrid.innerHTML = '<div class="loading">Loading events...</div>';

  try {
    const response = await fetch(`${API_BASE}/events`);
    if (!response.ok) throw new Error("Failed to load events");

    events = await response.json();

    if (events.length === 0) {
      eventsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No events available</h3>
                    <p>Check back later for upcoming events!</p>
                </div>
            `;
      return;
    }

    // Load registration counts for all events
    const eventsWithRegCounts = await Promise.all(
      events.map(async (event) => {
        try {
          const regResponse = await fetch(
            `${API_BASE}/events/${event.event_id}/registrations/count`
          );
          const regData = await regResponse.json();
          return { ...event, regCount: regData.count };
        } catch (error) {
          return { ...event, regCount: 0 };
        }
      })
    );

    eventsGrid.innerHTML = eventsWithRegCounts
      .map((event) => createEventCard(event))
      .join("");

    // Add event listeners to cards
    document.querySelectorAll(".event-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (!e.target.classList.contains("btn")) {
          const eventId = card.dataset.eventId;
          showEventDetails(eventId);
        }
      });
    });

    // Add register button listeners
    document.querySelectorAll(".btn-register").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const eventId = btn.dataset.eventId;
        openRegistrationModal(eventId);
      });
    });
  } catch (error) {
    showToast("Error loading events: " + error.message, "error");
    eventsGrid.innerHTML = `
            <div class="empty-state">
                <h3>Error loading events</h3>
                <p>Please try again later</p>
            </div>
        `;
  }
}

// Create event card HTML
function createEventCard(event) {
  const startDate = formatDate(event.start_date);
  const endDate = formatDate(event.end_date);
  const startTime = formatTime(event.start_time);
  const endTime = formatTime(event.end_time);
  const dateDisplay =
    startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  const regCount = event.regCount || 0;
  const isFull = event.max_participants && regCount >= event.max_participants;
  const spotsLeft = event.max_participants
    ? event.max_participants - regCount
    : null;

  return `
        <div class="event-card" data-event-id="${event.event_id}">
            <div class="event-card-header">
                <div class="event-id">${event.event_id}</div>
                ${isFull ? '<div class="event-badge full">Full</div>' : ""}
            </div>
            <h3 class="event-name">${event.event_name}</h3>
            ${
              event.description
                ? `<p class="event-description">${event.description}</p>`
                : ""
            }
            <div class="event-details">
                <div class="event-detail-item">
                    <span>📅 Date:</span> ${dateDisplay}
                </div>
                <div class="event-detail-item">
                    <span>🕐 Time:</span> ${startTime} - ${endTime}
                </div>
                ${
                  event.venue
                    ? `<div class="event-detail-item"><span>📍 Venue:</span> ${event.venue}</div>`
                    : ""
                }
                <div class="event-detail-item">
                    <span>👥 Registered:</span> ${regCount}${
    event.max_participants ? ` / ${event.max_participants}` : ""
  }
                    ${
                      spotsLeft !== null && !isFull
                        ? ` (${spotsLeft} spots left)`
                        : ""
                    }
                </div>
            </div>
            <div class="event-footer">
                <div class="event-date">${startDate}</div>
                <button class="btn btn-primary btn-register" data-event-id="${
                  event.event_id
                }" ${isFull ? "disabled" : ""}>
                    ${isFull ? "Full" : "Register"}
                </button>
            </div>
        </div>
    `;
}

// Show event details modal
async function showEventDetails(eventId) {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`);
    if (!response.ok) throw new Error("Failed to load event details");

    const event = await response.json();
    const modal = document.getElementById("event-details-modal");
    const content = document.getElementById("event-details-content");

    const startDate = formatDate(event.start_date);
    const endDate = formatDate(event.end_date);
    const startTime = formatTime(event.start_time);
    const endTime = formatTime(event.end_time);

    // Get registration count
    const regResponse = await fetch(
      `${API_BASE}/events/${eventId}/registrations/count`
    );
    const regData = await regResponse.json();
    const regCount = regData.count;

    content.innerHTML = `
            <h2>${event.event_name}</h2>
            <div class="event-info">
                <p><strong>Event ID:</strong> ${event.event_id}</p>
                ${
                  event.description
                    ? `<p><strong>Description:</strong> ${event.description}</p>`
                    : ""
                }
                <p><strong>Start Date:</strong> ${startDate} at ${startTime}</p>
                <p><strong>End Date:</strong> ${endDate} at ${endTime}</p>
                ${
                  event.venue
                    ? `<p><strong>Venue:</strong> ${event.venue}</p>`
                    : ""
                }
                ${
                  event.max_participants
                    ? `<p><strong>Max Participants:</strong> ${event.max_participants}</p>`
                    : ""
                }
                <p><strong>Registered:</strong> ${regCount} ${
      event.max_participants ? `of ${event.max_participants}` : ""
    }</p>
            </div>
            <button class="btn btn-primary" onclick="openRegistrationModal('${
              event.event_id
            }'); closeModal('event-details-modal');">Register Now</button>
        `;

    modal.classList.add("active");
  } catch (error) {
    showToast("Error loading event details: " + error.message, "error");
  }
}

// Setup event form (admin)
function setupEventForm() {
  const form = document.getElementById("event-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!requireAuth("admin")) {
      return;
    }

    const formData = new FormData(form);
    const eventData = {
      event_id: formData.get("event_id"),
      event_name: formData.get("event_name"),
      description: formData.get("description"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
      start_time: formData.get("start_time"),
      end_time: formData.get("end_time"),
      venue: formData.get("venue"),
      max_participants: formData.get("max_participants") || null,
    };

    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      showToast("Event created successfully!", "success");
      form.reset();
      loadAdminEvents();
      loadEvents();
    } catch (error) {
      showToast("Error: " + error.message, "error");
    }
  });
}

// Load events for admin page
async function loadAdminEvents() {
  const adminEventsList = document.getElementById("admin-events-list");
  if (!adminEventsList) return;

  if (!requireAuth("admin", { silent: true })) {
    adminEventsList.innerHTML =
      "<p>Admin access required to view this section.</p>";
    return;
  }

  adminEventsList.innerHTML = '<div class="loading">Loading events...</div>';

  try {
    const response = await fetch(`${API_BASE}/events`);
    if (!response.ok) throw new Error("Failed to load events");

    const adminEvents = await response.json();

    if (adminEvents.length === 0) {
      adminEventsList.innerHTML =
        "<p>No events created yet. Create your first event above!</p>";
      return;
    }

    // Load registration counts for all events
    const eventsWithRegCounts = await Promise.all(
      adminEvents.map(async (event) => {
        try {
          const regResponse = await fetch(
            `${API_BASE}/events/${event.event_id}/registrations/count`
          );
          const regData = await regResponse.json();
          return { ...event, regCount: regData.count };
        } catch (error) {
          return { ...event, regCount: 0 };
        }
      })
    );

    adminEventsList.innerHTML = eventsWithRegCounts
      .map(
        (event) => `
            <div class="admin-event-item">
                <div class="admin-event-info">
                    <h4>${event.event_name}</h4>
                    <p class="event-id">Event ID: <strong>${event.event_id}</strong></p>
                    <div class="event-details-mini">
                        <p><span>📅 Date:</span> ${formatDate(event.start_date)} - ${formatDate(event.end_date)}</p>
                        <p><span>🕐 Time:</span> ${formatTime(event.start_time)} - ${formatTime(event.end_time)}</p>
                        ${event.venue ? `<p><span>📍 Venue:</span> ${event.venue}</p>` : ''}
                        ${event.description ? `<p><span>📝 Description:</span> ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>` : ''}
                        <p><span>👥 Registrations:</span> ${event.regCount}${event.max_participants ? ` / ${event.max_participants}` : ''}</p>
                    </div>
                </div>
                <div class="admin-event-actions">
                    <button class="btn btn-primary btn-sm" onclick="showAdminEventDetails('${event.event_id}')">View Details</button>
                    <button class="btn btn-info btn-sm" onclick="showEventRegistrations('${event.event_id}')">View Registrations</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEvent('${event.event_id}')">Delete</button>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    showToast("Error loading events: " + error.message, "error");
  }
}

// Show admin event details
async function showAdminEventDetails(eventId) {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`);
    if (!response.ok) throw new Error("Failed to load event details");

    const event = await response.json();
    const modal = document.getElementById("event-details-modal");
    const content = document.getElementById("event-details-content");

    const startDate = formatDate(event.start_date);
    const endDate = formatDate(event.end_date);
    const startTime = formatTime(event.start_time);
    const endTime = formatTime(event.end_time);

    // Get registration count
    const regResponse = await fetch(
      `${API_BASE}/events/${eventId}/registrations/count`
    );
    const regData = await regResponse.json();
    const regCount = regData.count;

    content.innerHTML = `
            <h2>${event.event_name}</h2>
            <div class="event-info">
                <p><strong>Event ID:</strong> ${event.event_id}</p>
                ${
                  event.description
                    ? `<p><strong>Description:</strong> ${event.description}</p>`
                    : ""
                }
                <p><strong>Start Date:</strong> ${startDate} at ${startTime}</p>
                <p><strong>End Date:</strong> ${endDate} at ${endTime}</p>
                ${
                  event.venue
                    ? `<p><strong>Venue:</strong> ${event.venue}</p>`
                    : ""
                }
                ${
                  event.max_participants
                    ? `<p><strong>Max Participants:</strong> ${event.max_participants}</p>`
                    : ""
                }
                <p><strong>Registered:</strong> ${regCount} ${
      event.max_participants ? `of ${event.max_participants}` : ""
    }</p>
                <p><strong>Created At:</strong> ${new Date(event.created_at).toLocaleString()}</p>
            </div>
            <div class="modal-actions">
                <button class="btn btn-info" onclick="showEventRegistrations('${event.event_id}'); closeModal('event-details-modal');">View Registrations</button>
                <button class="btn btn-secondary" onclick="closeModal('event-details-modal')">Close</button>
            </div>
        `;

    modal.classList.add("active");
  } catch (error) {
    showToast("Error loading event details: " + error.message, "error");
  }
}

// Show event registrations for admin
async function showEventRegistrations(eventId) {
  if (!requireAuth("admin")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/registrations`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) throw new Error("Failed to load registrations");

    const registrations = await response.json();
    const modal = document.getElementById("event-details-modal");
    const content = document.getElementById("event-details-content");

    // Get event info for header
    const eventResponse = await fetch(`${API_BASE}/events/${eventId}`);
    const event = await eventResponse.json();

    if (registrations.length === 0) {
      content.innerHTML = `
                <h2>Registrations for: ${event.event_name}</h2>
                <div class="event-info">
                    <p><strong>Event ID:</strong> ${event.event_id}</p>
                    <p class="empty-state">No registrations yet for this event.</p>
                </div>
                <button class="btn btn-secondary" onclick="closeModal('event-details-modal')">Close</button>
            `;
    } else {
      content.innerHTML = `
                <h2>Registrations for: ${event.event_name}</h2>
                <div class="event-info">
                    <p><strong>Event ID:</strong> ${event.event_id}</p>
                    <p><strong>Total Registrations:</strong> ${registrations.length}</p>
                </div>
                <div class="registrations-list">
                    <table class="registrations-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Registration Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${registrations
                              .map(
                                (reg, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${reg.user_name}</td>
                                    <td>${reg.user_email}</td>
                                    <td>${reg.user_phone || "N/A"}</td>
                                    <td>${new Date(reg.registration_date).toLocaleString()}</td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
                <button class="btn btn-secondary" onclick="closeModal('event-details-modal')">Close</button>
            `;
    }

    modal.classList.add("active");
  } catch (error) {
    showToast("Error loading registrations: " + error.message, "error");
  }
}

// Delete event
async function deleteEvent(eventId) {
  if (!requireAuth("admin")) {
    return;
  }

  if (!confirm("Are you sure you want to delete this event?")) return;

  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete event");
    }

    showToast("Event deleted successfully!", "success");
    loadAdminEvents();
    loadEvents();
  } catch (error) {
    showToast("Error: " + error.message, "error");
  }
}

// Setup registration form
function setupRegistrationForm() {
  const form = document.getElementById("registration-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!requireAuth("user")) {
      return;
    }

    if (!currentEventId) {
      showToast("Select an event to register for.", "error");
      return;
    }

    const formData = new FormData(form);
    const registrationData = {
      user_name: formData.get("reg_name"),
      user_phone: formData.get("reg_phone") || null,
    };

    try {
      const response = await fetch(
        `${API_BASE}/events/${currentEventId}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(registrationData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register");
      }

      showToast("Registration successful!", "success");
      closeModal("registration-modal");
      form.reset();
      updateRegistrationEmailField();
      // Reload events to update registration counts
      loadEvents();
    } catch (error) {
      showToast("Error: " + error.message, "error");
    }
  });
}

// Setup modals
function setupModals() {
  // Close modals when clicking outside
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Close buttons
  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", () => {
      const modal = closeBtn.closest(".modal");
      closeModal(modal.id);
    });
  });
}

// Open registration modal
function openRegistrationModal(eventId) {
  if (!requireAuth("user")) {
    return;
  }

  currentEventId = eventId;
  const modal = document.getElementById("registration-modal");
  updateRegistrationEmailField();
  modal.classList.add("active");
}

// Close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("active");
}

// Show toast notification
function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format time
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Make functions globally available
window.openRegistrationModal = openRegistrationModal;
window.closeModal = closeModal;
window.deleteEvent = deleteEvent;