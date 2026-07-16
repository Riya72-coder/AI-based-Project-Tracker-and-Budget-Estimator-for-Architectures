let allTasks = [];
let projectId = null;

document.addEventListener("DOMContentLoaded", init);

// ================= INIT =================
function init() {

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first ❌");
    window.location.href = "index.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  projectId = params.get("projectId");

  if (!projectId) {
    alert("No project selected ❌");
    window.location.href = "projects.html";
    return;
  }

  loadTasks();
}

// ================= LOAD TASKS =================
function loadTasks() {

  const token = localStorage.getItem("token");

  fetch(`http://localhost:5000/api/tasks/project/${projectId}`, {
    headers: {
      "Authorization": "Bearer " + token
    },
    cache: "no-store"
  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    })
    .then(tasks => {
      allTasks = tasks;
      renderTasks(tasks);
    })
    .catch(err => {
      console.error(err);
      alert("Error loading tasks ❌");
    });
}

// ================= RENDER =================
function renderTasks(tasks) {

  const container = document.getElementById("taskContainer");
  container.innerHTML = "";

  if (tasks.length === 0) {
    container.innerHTML = "<p class='no-task'>No tasks found 🚀</p>";
    return;
  }

  tasks.forEach(task => {

    const statusClass = task.status.toLowerCase().replace(" ", "-");

    container.innerHTML += `
      <div class="task-card">

        <div class="task-header">
          <h3>${task.name}</h3>
          <span class="status ${statusClass}">
            ${task.status}
          </span>
        </div>

        <p class="task-desc">${task.description || "No description"}</p>

        <div class="task-details">
          <div>👤 Assigned: <b>${task.assignedTo || "-"}</b></div>
          <div>📆 Start: ${task.startDate || "-"}</div>
          <div>⏳ Deadline: ${task.deadline ? task.deadline.split("T")[0] : "-"}</div>
        </div>

        <div class="task-extra">
          💰 Budget: ₹${task.cost || 0}
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width: ${task.progress || 0}%"></div>
        </div>
        <small>${task.progress || 0}% completed</small>

        <div class="actions">
          <button onclick="editTask(${task.id})">✏️ Edit</button>
          <button onclick="deleteTask(${task.id})">🗑️ Delete</button>
        </div>

      </div>
    `;
  });
}

// ================= FILTER =================
function filterTasks(status) {
  if (status === "all") renderTasks(allTasks);
  else renderTasks(allTasks.filter(t => t.status === status));
}

// ================= DELETE =================
function deleteTask(id) {

  const token = localStorage.getItem("token");

  if (!confirm("Delete this task?")) return;

  fetch(`http://localhost:5000/api/tasks/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Delete failed");
      alert("Task Deleted 🗑️");
      loadTasks();
    })
    .catch(err => {
      console.error(err);
      alert("Delete failed ❌");
    });
}

// ================= EDIT =================
function editTask(id) {
  window.location.href = `editTask.html?id=${id}&projectId=${projectId}`;
}