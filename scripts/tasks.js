document.addEventListener("DOMContentLoaded", function () {
  const eventId = localStorage.getItem("eventId");
  const eventName = localStorage.getItem("eventName");
  const tasks = JSON.parse(localStorage.getItem("tasks"));
  const taskStatuses = JSON.parse(localStorage.getItem("task-status-" + eventId));

  document.getElementById("event-name").textContent = eventName;

  const tasksTable = document.getElementById("tasks-table");
  const eventTasks = tasks.filter((task) => task.eventId === eventId);

  eventTasks.forEach((task, index) => {
    const row = document.createElement("tr");
    
    const eventIdCell = document.createElement("td");
    eventIdCell.textContent = task.eventId;
    
    const taskNameCell = document.createElement("td");
    taskNameCell.textContent = task.taskName;
    
    const statusCell = document.createElement("td");
    const select = document.createElement("select");
    select.id = "status-" + index;
    select.innerHTML = `
      <option value="Not Started">Not Started</option>
      <option value="In Progress">In Progress</option>
      <option value="Complete">Complete</option>
    `;
    if (taskStatuses && taskStatuses[index]) {
      select.value = taskStatuses[index];
    }
    statusCell.appendChild(select);
    
    row.appendChild(eventIdCell);
    row.appendChild(taskNameCell);
    row.appendChild(statusCell);
    tasksTable.appendChild(row);
  });
});

function confirmStatus() {
  const eventId = localStorage.getItem("eventId");
  const tasks = JSON.parse(localStorage.getItem("tasks"));
  const eventTasks = tasks.filter((task) => task.eventId === eventId);
  const taskStatuses = [];

  eventTasks.forEach((task, index) => {
    const select = document.getElementById("status-" + index);
    taskStatuses.push(select.value);
  });

  localStorage.setItem("task-status-" + eventId, JSON.stringify(taskStatuses));
  setWarningPopup("Task status updated successfully");
}

function setWarningPopup(msg) {
  document.getElementById("warning-msg").innerText = "MESSAGE\n" + msg;
  document.getElementById("warning-popup").style.padding = "20px";
  document.getElementById("warning-popup").style.border = "2px solid black";
  document.getElementById("contents-div").style.opacity = "10%";

  let closeButton = document.getElementById("close");
  if (!closeButton) {
    closeButton = document.createElement("input");
    closeButton.className = "close-btn";
    closeButton.id = "close";
    closeButton.value = "CLOSE";
    closeButton.type = "button";
    closeButton.addEventListener("click", reverseInvoice);
    document.getElementById("warning-popup").appendChild(closeButton);
  }
}

function reverseInvoice() {
  document.getElementById("warning-msg").innerText = "";
  document.getElementById("close").remove();
  document.getElementById("warning-popup").style.border = "none";
  document.getElementById("contents-div").style.opacity = "100%";
  document.getElementById("warning-popup").style.padding = "0px";
}
