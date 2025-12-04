// ============ EVENT MANAGEMENT APPLICATION - ALL FEATURES ============

const API_BASE = "/api";
let appInitialized = false;
let currentEventId = null;
let events = [];
let pageStack = [];
let currentPage = "events";

// Password visibility toggle
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
}

// Initialize app on page load
document.addEventListener("DOMContentLoaded", () => {
  if (!appInitialized) {
    initApp();
    appInitialized = true;
  }
});

// ============ APPLICATION STARTUP ============
async function initApp() {
  setupModals();
  attachAuthListeners();
  // Force login overlay on startup (do not auto-login)
  // Clear any previously stored auth to ensure user must explicitly login
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  authState.token = null;
  authState.user = null;
  applyRoleUI();
  showAuthOverlay("login");
}

// ============ AUTH STATE MANAGEMENT ============
const authState = {
  token: null,
  user: null,
};

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
    });
  }

  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      navigateBack();
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
    localStorage.setItem("authToken", authState.token);
    localStorage.setItem("authUser", JSON.stringify(authState.user));
    event.target.reset();
    applyRoleUI();
    setupEventForm();
    setupRegistrationForm();
    await loadEvents();
    initializeNavigation();
    hideAuthOverlay();
    // Navigate based on role
    if (authState.user && authState.user.role === "admin") {
      showPage("admin-dashboard");
    } else {
      showPage("events");
    }
  } catch (error) {
    alert("Login Error: " + error.message);
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const password = formData.get("register_password");
  // confirm password removed from UI; just validate strength

  if (!isPasswordStrong(password)) {
    alert(
      "Password must be at least 8 characters with letters, numbers, and special characters"
    );
    return;
  }

  const role = formData.get("register_role") || "user";

  const payload = {
    email: formData.get("register_email").trim(),
    password: password,
    role,
  };

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

    authState.token = data.token;
    authState.user = data.user;
    localStorage.setItem("authToken", authState.token);
    localStorage.setItem("authUser", JSON.stringify(authState.user));
    event.target.reset();
    applyRoleUI();
    setupEventForm();
    setupRegistrationForm();
    await loadEvents();
    initializeNavigation();
    hideAuthOverlay();
  } catch (error) {
    alert("Registration Error: " + error.message);
  }
}

async function verifySession() {
  if (!authState.token) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authState.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      clearAuthState();
      return false;
    }

    const data = await response.json();
    authState.user = data.user;
    return true;
  } catch (error) {
    clearAuthState();
    return false;
  }
}

function clearAuthState() {
  authState.token = null;
  authState.user = null;
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${authState.token}`,
    "Content-Type": "application/json",
  };
}

function switchAuthMode(mode) {
  // Toggle the forms inside the auth-card (don't hide the whole card)
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (mode === "login") {
    if (loginForm) {
      loginForm.classList.add("active");
      loginForm.style.display = "block";
    }
    if (registerForm) {
      registerForm.classList.remove("active");
      registerForm.style.display = "none";
    }
  } else {
    if (loginForm) {
      loginForm.classList.remove("active");
      loginForm.style.display = "none";
    }
    if (registerForm) {
      registerForm.classList.add("active");
      registerForm.style.display = "block";
    }
  }
}

function applyRoleUI() {
  const authOverlay = document.getElementById("auth-overlay");
  const mainContent = document.querySelector(".header");
  const adminBtn = document.getElementById("admin-nav-btn");
  const dashboardBtn = document.getElementById("admin-dashboard-nav-btn");

  if (authState.token && authState.user) {
    if (authOverlay) authOverlay.style.display = "none";

    // Admin users should not see the public Events page; only creation and dashboard
    const eventsNav = document.querySelector('[data-page="events"]');
    if (adminBtn && authState.user.role === "admin") {
      adminBtn.style.display = "block";
      dashboardBtn.style.display = "block";
      if (eventsNav) eventsNav.style.display = "none";
    } else {
      adminBtn.style.display = "none";
      dashboardBtn.style.display = "none";
      if (eventsNav) eventsNav.style.display = "inline-block";
    }

    const emailSpan = document.getElementById("auth-email");
    const rolePill = document.getElementById("auth-role-pill");
    if (emailSpan) emailSpan.textContent = authState.user.email;
    if (rolePill) rolePill.textContent = authState.user.role.toUpperCase();
    // show logout button when logged in
    const logoutBtn = document.getElementById("logout-btn");
    const backBtn = document.getElementById("back-btn");
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (backBtn)
      backBtn.style.display = pageStack.length > 0 ? "inline-block" : "none";
  } else {
    if (authOverlay) authOverlay.style.display = "flex";
    if (adminBtn) adminBtn.style.display = "none";
    if (dashboardBtn) dashboardBtn.style.display = "none";
    const logoutBtn = document.getElementById("logout-btn");
    const backBtn = document.getElementById("back-btn");
    if (logoutBtn) logoutBtn.style.display = "none";
    if (backBtn) backBtn.style.display = "none";
  }
}

function hideAuthOverlay() {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.style.display = "none";
}

function showAuthOverlay(mode = "login") {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) {
    overlay.style.display = "flex";
    if (mode) switchAuthMode(mode);
  }
}

function isPasswordStrong(password) {
  if (password.length < 8) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_\-+=[\]{};'"\\|,.<>/?]/.test(password)) return false;
  return true;
}

// ============ NAVIGATION ============
function initializeNavigation() {
  const navItems = document.querySelectorAll("[data-page]");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;
      showPage(page);
    });
  });
}

function showPage(page) {
  const pages = document.querySelectorAll("[data-page-content]");
  const navButtons = document.querySelectorAll("[data-page]");

  pages.forEach((p) => {
    p.style.display = "none";
  });

  navButtons.forEach((btn) => {
    btn.classList.remove("active");
  });

  const selectedPage = document.querySelector(`[data-page-content="${page}"]`);
  const activeBtn = document.querySelector(`[data-page="${page}"]`);

  if (selectedPage) {
    selectedPage.style.display = "block";
  }
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  if (page === "events") {
    loadEvents();
    currentPage = "events";
  } else if (page === "admin-dashboard") {
    if (authState.user && authState.user.role === "admin") {
      loadAdminDashboardEvents();
    } else {
      alert("You don't have admin access");
      showPage("events");
    }
  }
}

// Navigate to a page and push the previous page onto the stack (if push === true)
function navigateToPage(page, options = { push: true, data: null }) {
  if (options.push) {
    pageStack.push(currentPage);
  }
  showPage(page);
  currentPage = page;
  // show/hide back button
  const backBtn = document.getElementById("back-btn");
  if (backBtn)
    backBtn.style.display = pageStack.length > 0 ? "inline-block" : "none";
  // if data provided, dispatch a custom event so page-specific loader can react
  if (options.data) {
    const ev = new CustomEvent("page:data", {
      detail: { page, data: options.data },
    });
    window.dispatchEvent(ev);
  }
}

function navigateBack() {
  if (pageStack.length === 0) return;
  const prev = pageStack.pop();
  showPage(prev);
  currentPage = prev;
  const backBtn = document.getElementById("back-btn");
  if (backBtn)
    backBtn.style.display = pageStack.length > 0 ? "inline-block" : "none";
}

// ============ MODAL MANAGEMENT ============
function setupModals() {
  const modals = document.querySelectorAll(".modal");
  const closeButtons = document.querySelectorAll(".modal-close");

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      if (modal) {
        modal.classList.remove("active");
      }
    });
  });

  modals.forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
}

// ============ DATE/TIME FORMATTING ============
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Convert 24-hr time input to 12-hr display format for event creation form
function convertTimeTo12Hr(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour.toString().padStart(2, "0")}:${m} ${ampm}`;
}

// Helper to add one hour to a HH:MM time string (used for end_time defaults)
function addOneHour(timeStr) {
  if (!timeStr) return timeStr;
  const [h, m] = timeStr.split(":").map((t) => parseInt(t, 10));
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  d.setHours(d.getHours() + 1);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isRegistrationDeadlinePassed(deadlineDate, deadlineTime) {
  if (!deadlineDate || !deadlineTime) return false;
  const deadline = new Date(`${deadlineDate}T${deadlineTime}`);
  const now = new Date();
  return now > deadline;
}

// ============ EVENTS DISPLAY MODULE ============

async function loadEvents() {
  const eventsGrid = document.getElementById("events-grid");
  if (!eventsGrid) return;

  eventsGrid.innerHTML = '<div class="loading">Loading events...</div>';

  try {
    const response = await fetch(`${API_BASE}/events`);
    if (!response.ok) throw new Error("Failed to load events");

    events = await response.json();

    if (events.length === 0) {
      eventsGrid.innerHTML =
        '<div class="empty-state"><h3>No events available</h3></div>';
      return;
    }

    eventsGrid.innerHTML = events.map((e) => createEventCard(e)).join("");
    attachEventCardListeners();
  } catch (error) {
    eventsGrid.innerHTML = `<div class="empty-state"><h3>Error loading events</h3><p>${error.message}</p></div>`;
  }
}

function createEventCard(event) {
  const eventId = event.event_id || event.id;
  const eventName = event.event_name || event.name || "Untitled Event";
  return `
        <div class="event-card" data-event-id="${eventId}">
            <div class="event-card-header">
                <h3>${eventName}</h3>
            </div>
        </div>
    `;
}

function attachEventCardListeners() {
  document.querySelectorAll(".event-card").forEach((card) => {
    const cardHeader = card.querySelector(".event-card-header");

    // Clicking the card header navigates to the event details page
    cardHeader.addEventListener("click", () => {
      const eventId = card.dataset.eventId;
      navigateToPage("event-details", { push: true, data: { eventId } });
    });
  });
}

// ============ ANNOUNCEMENTS FEATURE ============

async function openAnnouncementsPage(eventId) {
  // Populate announcements page and navigate to it
  currentEventId = eventId;
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/announcements`);
    const announcements = response.ok ? await response.json() : [];

    const body = document.getElementById("announcements-page-body");
    let html = `<h3>Announcements for this event</h3>`;
    if (announcements.length === 0) {
      html += `<p>No announcements yet</p>`;
    } else {
      html += `<div class="announcements-list">`;
      announcements.forEach((ann) => {
        html += `
                    <div class="announcement-card">
                        <p class="announcement-date">${formatDate(
                          ann.created_at
                        )}</p>
                        <p class="announcement-text">${ann.message}</p>
                    </div>
                `;
      });
      html += `</div>`;
    }
    body.innerHTML = html;
    navigateToPage("announcements", { push: true, data: { eventId } });
  } catch (error) {
    alert("Error loading announcements: " + error.message);
  }
}

// Page data handler: called when navigateToPage includes data
window.addEventListener("page:data", (e) => {
  const { page, data } = e.detail || {};
  if (!page) return;
  if (page === "event-details" && data?.eventId) {
    loadEventDetails(data.eventId);
  }
  if (page === "admin-event-details" && data?.eventId) {
    loadAdminEventDetailsPage(data.eventId);
  }
  if (page === "announcements" && data?.eventId) {
    // already populated in openAnnouncementsPage, but attempt a refresh
    // no-op for now
  }
  if (page === "queries" && data?.eventId) {
    loadQueriesForPage(data.eventId);
  }
  if (page === "admin-announcements" && data?.eventId) {
    loadAdminAnnouncementsPage(data.eventId);
  }
  if (page === "admin-queries" && data?.eventId) {
    loadAdminQueriesPage(data.eventId);
  }
  if (page === "admin-edit-event" && data?.eventId) {
    loadAdminEditEventPage(data.eventId);
  }
  if (page === "admin-registrations" && data?.eventId) {
    loadAdminRegistrationsPage(data.eventId);
  }
});

async function loadEventDetails(eventId) {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`);
    if (!response.ok) throw new Error("Event not found");
    const event = await response.json();
    const container = document.getElementById("event-details-body");
    let html = `
            <div class="event-info">
                <h3>${event.event_name || event.name}</h3>
                <p><strong>Date:</strong> ${formatDate(
                  event.start_date || event.event_date
                )}</p>
                <p><strong>Time:</strong> ${formatTime(
                  event.start_time || event.event_time
                )}</p>
                <p><strong>Location:</strong> ${
                  event.venue || event.location
                }</p>
                <p><strong>Description:</strong> ${event.description}</p>
                <p><strong>Registration Deadline:</strong> ${formatDate(
                  event.registration_deadline_date
                )} ${formatTime(event.registration_deadline_time)}</p>
            </div>
            <div class="event-actions">
        `;

    // If user is a regular user, show register button
    if (authState.user && authState.user.role === "user") {
      if (
        isRegistrationDeadlinePassed(
          event.registration_deadline_date,
          event.registration_deadline_time
        )
      ) {
        html += `<button class="btn btn-danger" disabled>Deadline Closed</button>`;
      } else {
        html += `<button class="btn btn-primary" id="details-register-btn">Register</button>`;
      }
    }

    html += ` <button class="btn btn-info" id="details-announcements-btn">Announcements</button> `;
    html += ` <button class="btn btn-warning" id="details-queries-btn">Queries</button>`;
    html += `</div>`;

    container.innerHTML = html;

    // Attach button listeners
    const regBtn = document.getElementById("details-register-btn");
    if (regBtn) {
      regBtn.addEventListener("click", () => openRegistrationModal(eventId));
    }

    const annBtn = document.getElementById("details-announcements-btn");
    if (annBtn)
      annBtn.addEventListener("click", () => openAnnouncementsPage(eventId));

    const qBtn = document.getElementById("details-queries-btn");
    if (qBtn) qBtn.addEventListener("click", () => openQueriesPage(eventId));
  } catch (error) {
    alert("Error loading event details: " + error.message);
  }
}

async function loadQueriesForPage(eventId) {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/queries`, {
      headers: getAuthHeaders(),
    });
    const queries = response.ok ? await response.json() : [];
    const list = document.getElementById("user-queries-list");
    if (!list) return;
    if (queries.length === 0) {
      list.innerHTML = `<p>No queries yet</p>`;
      return;
    }
    list.innerHTML = queries
      .map(
        (q) => `
            <div class="query-card">
                <p class="query-text">${q.message}</p>
                <p class="query-date">${formatDate(q.created_at)}</p>
                ${
                  q.admin_reply
                    ? `<p class="admin-reply"><strong>Admin Reply:</strong> ${q.admin_reply}</p>`
                    : ""
                }
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading queries for page:", error);
  }
}

async function loadAdminAnnouncementsPage(eventId) {
  // load admin interface for creating/positioning announcements
  const container = document.getElementById("admin-announcements-body");
  container.innerHTML = `
        <h3>Post Announcement</h3>
        <form id="admin-post-announcement">
            <div class="form-group"><textarea id="admin-ann-txt" rows="4" required></textarea></div>
            <button class="btn btn-primary" type="submit">Post</button>
        </form>
        <div id="admin-ann-list"></div>
    `;

  document
    .getElementById("admin-post-announcement")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("admin-ann-txt").value.trim();
      if (!msg) return;
      try {
        const resp = await fetch(
          `${API_BASE}/events/${eventId}/announcements`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ message: msg }),
          }
        );
        if (!resp.ok) throw new Error("Failed to post announcement");
        alert("Announcement posted");
        document.getElementById("admin-ann-txt").value = "";
      } catch (err) {
        alert(err.message);
      }
    });
}

async function loadAdminQueriesPage(eventId) {
  const container = document.getElementById("admin-queries-body");
  container.innerHTML = `<div id="admin-queries-list">Loading...</div>`;
  try {
    const resp = await fetch(`${API_BASE}/events/${eventId}/admin-queries`, {
      headers: getAuthHeaders(),
    });
    if (!resp.ok) throw new Error("Failed to load queries");
    const qs = await resp.json();
    const list = document.getElementById("admin-queries-list");
    list.innerHTML = qs
      .map(
        (q) => `
            <div class="query-card">
                <p><strong>From:</strong> ${q.user_name}</p>
                <p>${q.message}</p>
                <p>${formatDate(q.created_at)}</p>
                <form class="reply-form" data-query-id="${q.id}">
                    <textarea class="reply-text" required rows="2"></textarea>
                    <button class="btn btn-primary" type="submit">Reply</button>
                </form>
            </div>
        `
      )
      .join("");

    list.querySelectorAll(".reply-form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        const queryId = form.dataset.queryId;
        submitQueryReply(e, queryId);
      });
    });
  } catch (err) {
    container.innerHTML = `<p>Error loading queries</p>`;
  }
}

async function loadAdminEditEventPage(eventId) {
  try {
    const resp = await fetch(`${API_BASE}/events/${eventId}`);
    if (!resp.ok) throw new Error("Event not found");
    const event = await resp.json();
    const container = document.getElementById("admin-edit-event-body");

    // Display times in 12-hr format but keep inputs as 24-hr
    const eventTimeDisplay = formatTime(event.start_time || "");
    const deadlineTimeDisplay = formatTime(
      event.registration_deadline_time || ""
    );

    container.innerHTML = `
            <form id="admin-edit-event-form">
                <div class="form-group"><label>Event Name</label><input id="edit-name" value="${
                  event.event_name || event.name
                }" required></div>
                <div class="form-group"><label>Description</label><textarea id="edit-desc" rows="4">${
                  event.description
                }</textarea></div>
                <div class="form-group"><label>Date</label><input id="edit-date" type="date" value="${
                  event.start_date || ""
                }" required></div>
                <div class="form-group">
                    <label>Time (${eventTimeDisplay})</label>
                    <input id="edit-time" type="time" value="${
                      event.start_time || ""
                    }" required>
                </div>
                <div class="form-group"><label>Registration Deadline Date</label><input id="edit-deadline-date" type="date" value="${
                  event.registration_deadline_date || ""
                }" required></div>
                <div class="form-group">
                    <label>Registration Deadline Time (${deadlineTimeDisplay})</label>
                    <input id="edit-deadline-time" type="time" value="${
                      event.registration_deadline_time || ""
                    }" required>
                </div>
                <div class="form-group"><label>Location</label><input id="edit-location" value="${
                  event.venue || event.location || ""
                }"></div>
                <button class="btn btn-primary" type="submit">Save Changes</button>
            </form>
        `;

    document
      .getElementById("admin-edit-event-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const startDate = document.getElementById("edit-date").value;
        const startTime = document.getElementById("edit-time").value;
        const endDate = startDate || event.start_date;
        const endTime = addOneHour(startTime || event.start_time);
        const payload = {
          event_name: document.getElementById("edit-name").value.trim(),
          description: document.getElementById("edit-desc").value.trim(),
          start_date: startDate,
          end_date: endDate,
          start_time: startTime,
          end_time: endTime,
          registration_deadline_date:
            document.getElementById("edit-deadline-date").value,
          registration_deadline_time:
            document.getElementById("edit-deadline-time").value,
          venue: document.getElementById("edit-location").value.trim(),
          max_participants: event.max_participants || 100,
        };
        try {
          const r = await fetch(`${API_BASE}/events/${eventId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          });
          if (!r.ok) throw new Error("Failed to save");
          alert("Event updated");
          await loadAdminDashboardEvents();
          navigateBack();
        } catch (err) {
          alert(err.message);
        }
      });
  } catch (err) {
    document.getElementById(
      "admin-edit-event-body"
    ).innerHTML = `<p>Error loading event</p>`;
  }
}

// ============ QUERIES FEATURE ============

async function openQueriesPage(eventId) {
  currentEventId = eventId;
  const body = document.getElementById("queries-page-body");
  let html = `
        <h3>Ask a Question</h3>
        <form class="query-form" onsubmit="submitQuery(event)">
            <div class="form-group">
                <label for="query-text">Your Query</label>
                <textarea id="query-text" rows="4" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Submit Query</button>
        </form>
        <div id="user-queries-list"></div>
    `;
  body.innerHTML = html;

  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/queries`, {
      headers: getAuthHeaders(),
    });
    const queries = response.ok ? await response.json() : [];
    const queriesList = document.getElementById("user-queries-list");
    if (queries.length > 0) {
      queriesList.innerHTML =
        `<h3>Your Queries</h3>` +
        queries
          .map(
            (q) => `
                <div class="query-card">
                    <p class="query-text">${q.message}</p>
                    <p class="query-date">${formatDate(q.created_at)}</p>
                    ${
                      q.admin_reply
                        ? `<p class="admin-reply"><strong>Admin Reply:</strong> ${q.admin_reply}</p>`
                        : ""
                    }
                </div>
            `
          )
          .join("");
    }
  } catch (error) {
    console.error("Error loading queries:", error);
  }

  navigateToPage("queries", { push: true, data: { eventId } });
}

async function submitQuery(event) {
  event.preventDefault();

  const queryText = document.getElementById("query-text").value.trim();
  if (!queryText) {
    alert("Please enter a query");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/events/${currentEventId}/queries`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ message: queryText }),
      }
    );

    if (!response.ok) throw new Error("Failed to submit query");

    alert("Query submitted successfully");
    document.getElementById("query-text").value = "";
    await loadQueriesForPage(currentEventId);
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// ============ REGISTRATION MODULE ============

function setupRegistrationForm() {
  const form = document.getElementById("registration-form");
  if (!form) return;

  // Prevent attaching multiple submit handlers (which can cause duplicate registrations)
  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registration-name").value.trim();
    const email = document.getElementById("registration-email").value.trim();
    const phone = document.getElementById("registration-phone").value.trim();

    if (!name || !email || !phone) {
      alert("Please fill all required fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/events/${currentEventId}/register`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            user_name: name,
            user_phone: phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      alert("Successfully registered for event!");
      closeModal("registration-modal");
      form.reset();
      await loadEvents();
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}

function openRegistrationModal(eventId) {
  if (!authState.token) {
    alert("Please login to register for events");
    showAuthOverlay("login");
    return;
  }

  currentEventId = eventId;
  const modal = document.getElementById("registration-modal");

  const emailInput = document.getElementById("registration-email");
  if (authState.user && authState.user.email) {
    emailInput.value = authState.user.email;
  }

  document.getElementById("registration-name").value = "";
  document.getElementById("registration-phone").value = "";

  modal.classList.add("active");
}

// ============ ADMIN EVENT CREATION ============

function setupEventForm() {
  const form = document.getElementById("event-form");
  if (!form) return;

  // Add event listeners to time inputs to display in 12-hr format
  const eventTimeInput = document.getElementById("event-time");
  const deadlineTimeInput = document.getElementById("event-reg-deadline-time");

  if (eventTimeInput) {
    eventTimeInput.addEventListener("change", (e) => {
      // Update display in real-time (keep input as 24-hr, but show formatted)
      // This is a UX enhancement - data sent will still be 24-hr
    });
  }

  if (deadlineTimeInput) {
    deadlineTimeInput.addEventListener("change", (e) => {
      // Same as above
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (authState.user && authState.user.role !== "admin") {
      alert("Only admins can create events");
      return;
    }

    const name = document.getElementById("event-name").value.trim();
    const description = document
      .getElementById("event-description")
      .value.trim();
    const eventDate = document.getElementById("event-date").value;
    const eventTime = document.getElementById("event-time").value;
    const regDeadlineDate = document.getElementById(
      "event-reg-deadline-date"
    ).value;
    const regDeadlineTime = document.getElementById(
      "event-reg-deadline-time"
    ).value;
    const location = document.getElementById("event-location").value.trim();
    const maxRegistrations =
      parseInt(document.getElementById("event-max-registrations").value) || 100;

    const eventData = {
      event_id: `EVT-${Date.now()}`,
      event_name: name,
      description,
      start_date: eventDate,
      end_date: eventDate,
      start_time: eventTime,
      end_time: addOneHour(eventTime),
      venue: location,
      max_participants: maxRegistrations,
      registration_deadline_date: regDeadlineDate,
      registration_deadline_time: regDeadlineTime,
    };

    if (
      !name ||
      !description ||
      !eventDate ||
      !eventTime ||
      !regDeadlineDate ||
      !regDeadlineTime ||
      !location
    ) {
      alert("Please fill all event fields");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      alert("Event created successfully!");
      form.reset();
      await loadAdminDashboardEvents();
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}

// ============ ADMIN DASHBOARD ============

async function loadAdminDashboardEvents() {
  const adminGrid = document.getElementById("admin-events-grid");
  if (!adminGrid) return;

  adminGrid.innerHTML = '<div class="loading">Loading your events...</div>';

  try {
    if (authState.user && authState.user.role !== "admin") {
      adminGrid.innerHTML =
        '<div class="empty-state">Admin access required</div>';
      return;
    }

    const response = await fetch(`${API_BASE}/events`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load events");

    const allEvents = await response.json();

    if (allEvents.length === 0) {
      adminGrid.innerHTML =
        '<div class="empty-state"><h3>No events created yet</h3></div>';
      return;
    }

    adminGrid.innerHTML = allEvents
      .map((e) => createAdminEventCard(e))
      .join("");
    attachAdminEventCardListeners();
  } catch (error) {
    adminGrid.innerHTML = `<div class="empty-state">Error loading events</div>`;
  }
}

function createAdminEventCard(event) {
  const eventId = event.event_id;
  const name = event.event_name || event.name || "Untitled Event";
  const date = formatDate(event.start_date || event.event_date);
  const time = formatTime(event.start_time || event.event_time);
  return `
        <div class="admin-event-card" data-event-id="${eventId}">
            <div class="admin-event-header">
                <h3>${name}</h3>
                <p>${date} ${time}</p>
            </div>
        </div>
    `;
}

function attachAdminEventCardListeners() {
  document.querySelectorAll(".admin-event-card").forEach((card) => {
    card.addEventListener("click", () => {
      const eventId = card.dataset.eventId;
      navigateToPage("admin-event-details", { push: true, data: { eventId } });
    });
  });
}

async function showAdminEventDetails(eventId) {
  // Keep for backwards compatibility: navigate into the admin event details page
  navigateToPage("admin-event-details", { push: true, data: { eventId } });
}

async function loadAdminEventDetailsPage(eventId) {
  const container = document.getElementById("admin-event-details-body");
  if (!container) return;
  container.innerHTML = "<p>Loading event...</p>";

  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`);
    if (!response.ok) throw new Error("Event not found");
    const event = await response.json();

    let regCount = 0;
    try {
      const regResponse = await fetch(
        `${API_BASE}/events/${eventId}/registrations/count`
      );
      if (regResponse.ok) {
        const regData = await regResponse.json();
        regCount = regData.count || 0;
      }
    } catch {
      // ignore registration count errors
    }

    const name = event.event_name || event.name || "Untitled Event";
    const date = formatDate(event.start_date || event.event_date);
    const time = formatTime(event.start_time || event.event_time);
    const regDeadlineDate = formatDate(event.registration_deadline_date);
    const regDeadlineTime = formatTime(event.registration_deadline_time);

    container.innerHTML = `
      <div class="event-info">
        <h3>${name}</h3>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Location:</strong> ${
          event.venue || event.location || "-"
        }</p>
        <p><strong>Description:</strong> ${event.description || "-"}</p>
        <p><strong>Registration Deadline:</strong> ${regDeadlineDate} ${regDeadlineTime}</p>
        <p><strong>Current Registrations:</strong> ${regCount}</p>
      </div>
      <div class="admin-event-actions">
        <button id="admin-detail-edit" class="btn btn-primary">Edit Event</button>
        <button id="admin-detail-registrations" class="btn btn-info">View Registrations</button>
        <button id="admin-detail-announcements" class="btn btn-warning">Post Announcement</button>
        <button id="admin-detail-queries" class="btn btn-secondary">View Queries</button>
        <button id="admin-detail-delete" class="btn btn-danger">Delete</button>
      </div>
    `;

    document
      .getElementById("admin-detail-edit")
      .addEventListener("click", () =>
        navigateToPage("admin-edit-event", { push: true, data: { eventId } })
      );
    document
      .getElementById("admin-detail-registrations")
      .addEventListener("click", () =>
        navigateToPage("admin-registrations", {
          push: true,
          data: { eventId },
        })
      );
    document
      .getElementById("admin-detail-announcements")
      .addEventListener("click", () =>
        navigateToPage("admin-announcements", {
          push: true,
          data: { eventId },
        })
      );
    document
      .getElementById("admin-detail-queries")
      .addEventListener("click", () =>
        navigateToPage("admin-queries", { push: true, data: { eventId } })
      );
    document
      .getElementById("admin-detail-delete")
      .addEventListener("click", () => deleteEvent(eventId));
  } catch (error) {
    container.innerHTML = `<p>Error loading event: ${error.message}</p>`;
  }
}

async function loadAdminRegistrationsPage(eventId) {
  const container = document.getElementById("admin-registrations-body");
  container.innerHTML = "<p>Loading registrations...</p>";
  try {
    const response = await fetch(
      `${API_BASE}/events/${eventId}/registrations`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) throw new Error("Failed to load registrations");

    const registrations = await response.json();

    if (!registrations || registrations.length === 0) {
      container.innerHTML = "<p>No registrations yet</p>";
    } else {
      let tableHTML =
        '<table class="registrations-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th></tr></thead><tbody>';
      registrations.forEach((reg) => {
        tableHTML += `
                    <tr>
                        <td>${reg.user_name || reg.name}</td>
                        <td>${reg.user_email || reg.email}</td>
                        <td>${reg.user_phone || reg.phone}</td>
                        <td>${formatDate(
                          reg.registration_date || reg.registered_at
                        )}</td>
                    </tr>
                `;
      });
      tableHTML += "</tbody></table>";
      container.innerHTML = tableHTML;
    }
  } catch (error) {
    container.innerHTML = `<p>Error loading registrations: ${error.message}</p>`;
  }
}

async function deleteEvent(eventId) {
  if (!confirm("Are you sure you want to delete this event?")) return;

  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to delete event");

    alert("Event deleted successfully");
    await loadAdminDashboardEvents();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// ============ ADMIN ANNOUNCEMENTS ============

async function openAdminAnnouncementsForm(eventId) {
  currentEventId = eventId;
  const modal = document.getElementById("admin-announcements-modal");
  const content = document.getElementById("admin-announcements-content");

  content.innerHTML = `
        <h2>Post Announcement</h2>
        <form class="announcement-form" onsubmit="submitAnnouncement(event)">
            <div class="form-group">
                <label for="announcement-text">Announcement</label>
                <textarea id="announcement-text" rows="4" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Post Announcement</button>
        </form>
    `;

  modal.classList.add("active");
}

async function submitAnnouncement(event) {
  event.preventDefault();

  const text = document.getElementById("announcement-text").value.trim();
  if (!text) {
    alert("Please enter an announcement");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/events/${currentEventId}/announcements`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ message: text }),
      }
    );

    if (!response.ok) throw new Error("Failed to post announcement");

    alert("Announcement posted successfully");
    closeModal("admin-announcements-modal");
    await loadAdminDashboardEvents();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// ============ ADMIN QUERIES ============

async function showEventQueries(eventId) {
  currentEventId = eventId;

  try {
    const response = await fetch(
      `${API_BASE}/events/${eventId}/admin-queries`,
      {
        headers: getAuthHeaders(),
      }
    );

    const queries = response.ok ? await response.json() : [];

    const modal = document.getElementById("admin-queries-modal");
    const content = document.getElementById("admin-queries-content");

    let html = `<h2>Event Queries</h2>`;

    if (queries.length === 0) {
      html += `<p>No queries yet</p>`;
    } else {
      html += `<div class="queries-list">`;
      queries.forEach((q) => {
        html += `
                    <div class="query-card" data-query-id="${q.id}">
                        <p><strong>From:</strong> ${q.user_name}</p>
                        <p><strong>Query:</strong> ${q.message}</p>
                        <div class="reply-section">
                            ${
                              q.admin_reply
                                ? `<p><strong>Your Reply:</strong> ${q.admin_reply}</p>`
                                : ""
                            }
                            <form class="reply-form" data-query-id="${q.id}">
                                <textarea class="reply-text" placeholder="Write your reply..." rows="2" required></textarea>
                                <button type="submit" class="btn btn-small btn-primary">Reply</button>
                            </form>
                        </div>
                    </div>
                `;
      });
      html += `</div>`;
    }

    content.innerHTML = html;

    content.querySelectorAll(".reply-form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        const queryId = form.dataset.queryId;
        submitQueryReply(e, queryId);
      });
    });

    modal.classList.add("active");
  } catch (error) {
    alert("Error loading queries: " + error.message);
  }
}

async function submitQueryReply(e, queryId) {
  if (e && e.preventDefault) {
    e.preventDefault();
  }

  const form =
    (e && e.target) ||
    document.querySelector(`.reply-form[data-query-id="${queryId}"]`);
  if (!form) return;

  const replyText = form.querySelector(".reply-text").value.trim();
  if (!replyText) {
    alert("Please enter a reply");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/queries/${queryId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ reply: replyText }),
    });

    if (!response.ok) throw new Error("Failed to submit reply");

    alert("Reply submitted successfully");
    await showEventQueries(currentEventId);
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// ============ GLOBAL EXPORTS FOR ONCLICK HANDLERS ============
window.openRegistrationModal = openRegistrationModal;
window.closeModal = closeModal;
window.deleteEvent = deleteEvent;
window.showAdminEventDetails = showAdminEventDetails;
window.showEventRegistrations = showEventRegistrations;
window.showPage = showPage;
window.togglePasswordVisibility = togglePasswordVisibility;
window.submitQuery = submitQuery;
window.openAnnouncementsPage = openAnnouncementsPage;
window.openQueriesPage = openQueriesPage;
window.openAdminAnnouncementsForm = openAdminAnnouncementsForm;
window.submitAnnouncement = submitAnnouncement;
window.showEventQueries = showEventQueries;
window.submitQueryReply = submitQueryReply;
