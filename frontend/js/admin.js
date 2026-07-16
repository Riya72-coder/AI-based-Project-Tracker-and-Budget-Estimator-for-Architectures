document.addEventListener("DOMContentLoaded", init);

let token = null;
let allUsers = [];
let allProjects = [];
let currentEditId = null;
let loggedInEmail = null;

// ================= INIT =================
async function init() {

  token = localStorage.getItem("token");
  loggedInEmail = localStorage.getItem("email");

  if (!token) {
    alert("Login required ❌");
    window.location.href = "index.html";
    return;
  }

  await loadStats();
  await loadUsers();
  await loadProjects();
  await loadContactMessages();

  setupSearch();
  setupLogout();
  setupModal(); // 🔥 important
}

// ================= TOAST =================
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// ================= STATS =================
async function loadStats() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/stats", {
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();

    document.getElementById("totalUsers").textContent = data.users;
    document.getElementById("totalProjects").textContent = data.projects;
    document.getElementById("totalTasks").textContent = data.tasks;

  } catch (err) {
    console.error(err);
  }
}

// ================= USERS =================
async function loadUsers() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/users", {
      headers: { "Authorization": "Bearer " + token }
    });

    const users = await res.json();

    allUsers = users;
    displayUsers(users);

  } catch (err) {
    console.error(err);
  }
}

function displayUsers(users) {
  const table = document.getElementById("usersTable");
  table.innerHTML = "";

  if (users.length === 0) {
    table.innerHTML = "<tr><td colspan='4'>No users</td></tr>";
    return;
  }

  users.forEach(u => {

    const isSelf = u.email === loggedInEmail;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>
        <button onclick="toggleRole(${u.id}, '${u.role}')">
          ${u.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
        </button>
        ${!isSelf ? `<button onclick="deleteUser(${u.id})">Delete</button>` : ''}
      </td>
    `;

    table.appendChild(tr);
  });
}

// ================= ROLE CHANGE =================
async function toggleRole(id, currentRole) {

  const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";

  if (!confirm(`Change role to ${newRole}?`)) return;

  try {
    await fetch(`http://localhost:5000/api/admin/users/${id}/role`, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ role: newRole })
    });

    showToast("Role updated ✅");
    loadUsers();

  } catch (err) {
    console.error(err);
  }
}

// ================= PROJECTS =================
async function loadProjects() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/projects", {
      headers: { "Authorization": "Bearer " + token }
    });

    const projects = await res.json();

    allProjects = projects;
    displayProjects(projects);

  } catch (err) {
    console.error(err);
  }
}

function displayProjects(projects) {
  const table = document.getElementById("projectsTable");
  table.innerHTML = "";

  if (projects.length === 0) {
    table.innerHTML = "<tr><td colspan='5'>No projects</td></tr>";
    return;
  }

  projects.forEach(p => {

    const safeName = p.name.replace(/'/g, "\\'");
    const safeDeadline = p.deadline || "";

    let status = p.status || "Pending";

    const validStatus = ["Pending", "In Progress", "Completed", "Delayed"];
    if (!validStatus.includes(status)) {
      status = "Pending";
    }

    const statusClass = `status-badge status-${status.replace(/\s/g, "\\ ")}`;

    let deadlineClass = "";

    if (p.deadline) {
      const today = new Date();
      const deadlineDate = new Date(p.deadline);

      const diff = (deadlineDate - today) / (1000 * 60 * 60 * 24);

      if (diff < 0 && status !== "Completed") {
        deadlineClass = "deadline-red";
      } else if (diff < 3) {
        deadlineClass = "deadline-warning";
      }
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.userEmail}</td>
      <td class="${deadlineClass}">${p.deadline || "-"}</td>
      <td><span class="${statusClass}">${status}</span></td>
      <td>
        <button onclick="viewProject(${p.id})">View</button>
        <button onclick="openEditModal(${p.id}, '${safeName}', '${safeDeadline}', '${status}')">Edit</button>
        <button onclick="deleteProject(${p.id})">Delete</button>
      </td>
    `;

    table.appendChild(tr);
  });
}

// ================= 🔥 CONTACT =================
async function loadContactMessages() {
  try {
    const res = await fetch("http://localhost:5000/api/contact", {
      headers: { "Authorization": "Bearer " + token }
    });

    const messages = await res.json();
    displayContactMessages(messages);

  } catch (err) {
    console.error(err);
  }
}

function displayContactMessages(messages) {
  const table = document.getElementById("contactTable");
  if (!table) return;

  table.innerHTML = "";

  if (messages.length === 0) {
    table.innerHTML = "<tr><td colspan='4'>No messages</td></tr>";
    return;
  }

  messages.reverse().forEach(m => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${m.name}</td>
      <td>${m.email}</td>
      <td>${m.message}</td>
      <td>${new Date(m.time).toLocaleString()}</td>
    `;

    table.appendChild(tr);
  });
}

// ================= 🔥 EDIT MODAL =================
function openEditModal(id, name, deadline, status) {

  currentEditId = id;

  document.getElementById("editName").value = name;
  document.getElementById("editDeadline").value = deadline;
  document.getElementById("editStatus").value = status;

  document.getElementById("editModal").style.display = "flex";
}

// ================= 🔥 MODAL SETUP =================
function setupModal() {

  document.getElementById("saveEdit")?.addEventListener("click", async () => {

    const name = document.getElementById("editName").value;
    const deadline = document.getElementById("editDeadline").value;
    const status = document.getElementById("editStatus").value;

    try {
      await fetch(`http://localhost:5000/api/projects/${currentEditId}`, {
        method: "PUT",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, deadline, status })
      });

      showToast("Project updated ✅");

      document.getElementById("editModal").style.display = "none";
      loadProjects();

    } catch (err) {
      console.error(err);
    }
  });

  document.getElementById("closeModal")?.addEventListener("click", () => {
    document.getElementById("editModal").style.display = "none";
  });
}

// ================= VIEW =================
function viewProject(id) {
  localStorage.setItem("viewMode", "admin");
  window.location.href = `admin-dashboard.html?id=${id}`;
}

// ================= DELETE =================
async function deleteProject(id) {
  if (!confirm("Delete project?")) return;

  try {
    await fetch(`http://localhost:5000/api/projects/${id}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });

    showToast("Project deleted ✅");
    loadProjects();

  } catch (err) {
    console.error(err);
  }
}

async function deleteUser(id) {
  if (!confirm("Delete user?")) return;

  try {
    await fetch(`http://localhost:5000/api/admin/users/${id}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });

    showToast("User deleted ✅");
    loadUsers();

  } catch (err) {
    console.error(err);
  }
}

// ================= SEARCH =================
function setupSearch() {

  document.getElementById("userSearch")?.addEventListener("input", function () {
    const val = this.value.toLowerCase();

    displayUsers(allUsers.filter(u =>
      u.name.toLowerCase().includes(val) ||
      u.email.toLowerCase().includes(val)
    ));
  });

  document.getElementById("projectSearch")?.addEventListener("input", function () {
    const val = this.value.toLowerCase();

    displayProjects(allProjects.filter(p =>
      p.name.toLowerCase().includes(val) ||
      p.userEmail.toLowerCase().includes(val)
    ));
  });
}

// ================= LOGOUT =================
function setupLogout() {
  const btn = document.getElementById("logoutBtn");

  if (btn) {
    btn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("viewMode");
      window.location.href = "index.html";
    });
  }
}