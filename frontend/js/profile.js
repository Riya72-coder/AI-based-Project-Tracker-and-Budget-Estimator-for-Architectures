document.addEventListener("DOMContentLoaded", init);

let currentUser = null;

// ================= INIT =================
async function init() {

  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  try {

    const res = await fetch("http://localhost:5000/api/users/me", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Unauthorized");

    currentUser = await res.json();

    setupUI();

    // 🔥 ROLE BASED LOGIC
    if (currentUser.role === "ADMIN") {
      enableAdminView();
      loadAdminStats();
    } else {
      loadTaskStats(); // user only
    }

    loadProjectStats();     // 🔥 FIXED
    loadRecentActivity();   // 🔥 FIXED

  } catch (err) {
    console.error("Profile Error:", err);
    localStorage.clear();
    window.location.href = "index.html";
  }

  setupLogout();
}

// ================= UI =================
function setupUI() {

  document.getElementById("navUserName").textContent = currentUser.name;

  let imgPath = "images/default-user.png";

  if (currentUser.profilePic) {
    imgPath = `http://localhost:5000/uploads/${currentUser.profilePic}`;
  }

  document.getElementById("navProfileImg").src = imgPath;
  document.getElementById("profileImg").src = imgPath;

  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userEmail").textContent = currentUser.email;
  document.getElementById("userCompany").textContent = currentUser.company;

  const badge = document.getElementById("roleBadge");

  if (currentUser.role === "ADMIN") {
    badge.textContent = "ADMIN";
    badge.classList.add("admin");
  } else {
    badge.textContent = "USER";
    badge.classList.add("user");
  }
}

// ================= ADMIN VIEW =================
function enableAdminView() {

  const adminSection = document.getElementById("adminSection");
  const adminActions = document.getElementById("adminActions");
  const userSection = document.getElementById("userSection");

  if (adminSection) adminSection.style.display = "block";
  if (adminActions) adminActions.style.display = "block";
  if (userSection) userSection.style.display = "none";
}

// ================= 🔥 PROJECT STATS (FIXED) =================
async function loadProjectStats() {

  try {
    const token = localStorage.getItem("token");

    let url = "";

    // 🔥 ADMIN = ALL PROJECTS
    if (currentUser.role === "ADMIN") {
      url = "http://localhost:5000/api/projects/all";
    } else {
      url = `http://localhost:5000/api/projects/${currentUser.email}`;
    }

    const res = await fetch(url, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const projects = await res.json();

    document.getElementById("totalProjects").textContent = projects.length;

    document.getElementById("completedProjects").textContent =
      projects.filter(p => p.status === "Completed").length;

    document.getElementById("delayedProjects").textContent =
      projects.filter(p => p.status === "Delayed").length;

    document.getElementById("activeProjects").textContent =
      projects.filter(p => p.status === "In Progress").length;

  } catch (err) {
    console.error("Project stats error:", err);
  }
}

// ================= USER TASK STATS =================
async function loadTaskStats() {

  try {

    const token = localStorage.getItem("token");

    const projRes = await fetch(`http://localhost:5000/api/projects/${currentUser.email}`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const projects = await projRes.json();

    let allTasks = [];

    for (let p of projects) {

      const res = await fetch(`http://localhost:5000/api/tasks/project/${p.id}`, {
        headers: {
          "Authorization": "Bearer " + token
        }
      });

      const tasks = await res.json();
      allTasks = allTasks.concat(tasks);
    }

    document.getElementById("totalTasks").textContent = allTasks.length;

    document.getElementById("completedTasks").textContent =
      allTasks.filter(t => t.status === "Completed").length;

    document.getElementById("pendingTasks").textContent =
      allTasks.filter(t => t.status !== "Completed").length;

  } catch (err) {
    console.error("Task stats error:", err);
  }
}

// ================= ADMIN STATS =================
async function loadAdminStats() {

  try {

    const token = localStorage.getItem("token");

    // USERS
    const usersRes = await fetch("http://localhost:5000/api/users/all");
    const users = await usersRes.json();

    document.getElementById("totalUsers").textContent = users.length;

    // PROJECTS
    const projRes = await fetch("http://localhost:5000/api/projects/all", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const projects = await projRes.json();

    document.getElementById("totalProjectsAdmin").textContent = projects.length;

    document.getElementById("delayedProjectsAdmin").textContent =
      projects.filter(p => p.status === "Delayed").length;

  } catch (err) {
    console.error("Admin stats error:", err);
  }
}

// ================= 🔥 RECENT ACTIVITY (FIXED) =================
async function loadRecentActivity() {

  try {

    let url = "";

    // 🔥 ADMIN = ALL NOTIFICATIONS
    if (currentUser.role === "ADMIN") {
      url = "http://localhost:5000/api/notifications";
    } else {
      url = `http://localhost:5000/api/notifications/${currentUser.email}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    const box = document.getElementById("recentActivity");

    if (!data || data.length === 0) {
      box.innerHTML = "<p>No recent activity</p>";
      return;
    }

    box.innerHTML = data.slice(0, 5).map(n => `
      <div style="margin-bottom:10px;">
        <p>${n.message}</p>
        <small>${new Date(n.createdAt).toLocaleString()}</small>
      </div>
      <hr style="opacity:0.2;">
    `).join("");

  } catch (err) {
    console.error("Activity error:", err);
  }
}

// ================= UPLOAD =================
document.addEventListener("click", async (e) => {

  if (e.target.id === "uploadBtn") {

    const fileInput = document.getElementById("profileInput");

    if (!fileInput.files[0]) {
      alert("Select image!");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch(`http://localhost:5000/api/users/uploadProfile/${currentUser.id}`, {
      method: "POST",
      body: formData
    });

    alert(await res.text());
    location.reload();
  }
});

// ================= LOGOUT =================
function setupLogout() {

  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "index.html";
  });
}