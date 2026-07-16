document.addEventListener("DOMContentLoaded", init);

let currentUser = null;

/* 🔥 ADDED (safe global store) */
window.allProjects = [];

// ================= INIT =================
async function init() {

  const token = localStorage.getItem("token");

  if (!token) {
    document.querySelector(".project-grid").innerHTML =
      "<p>Please login first ⚠️</p>";
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
    loadProjects();
    setupSearch();

  } catch (err) {
    console.error(err);
    document.querySelector(".project-grid").innerHTML =
      "<p>Session expired ⚠️ Please login again</p>";
  }
}

// ================= UI =================
function setupUI() {

  document.getElementById("welcomeText").textContent =
    "Welcome " + currentUser.name;

  const badge = document.getElementById("roleBadge");

  if (currentUser.role === "ADMIN") {
    badge.textContent = "ADMIN";
    badge.classList.add("admin");

    document.getElementById("adminPanelBtn").style.display = "inline-block";

    const addBtn = document.querySelector(".add-project-btn");
    if (addBtn) addBtn.style.display = "none";

    const filter = document.getElementById("userFilter");
    if (filter) filter.style.display = "block";

  } else {
    badge.textContent = "USER";
    badge.classList.add("user");
  }

  const title = document.querySelector(".project-header h1");
  if (title) {
    if (currentUser.role === "ADMIN") {
      title.textContent = "All Projects";
    } else {
      title.textContent = "Your Projects";
    }
  }

  const avatar = document.querySelector(".user-avatar");
  if (avatar) {
    if (currentUser.profilePic) {
      avatar.src = `http://localhost:5000/uploads/${currentUser.profilePic}`;
    } else {
      avatar.src = "images/default-user.png";
    }
  }
}

// ================= SEARCH =================
function setupSearch() {

  const searchInput = document.querySelector(".navbar-search input");

  if (!searchInput) return;

  let timeout;

  searchInput.addEventListener("input", function () {

    clearTimeout(timeout);

    timeout = setTimeout(async () => {

      const query = searchInput.value.trim();
      const token = localStorage.getItem("token");

      if (query === "") {
        loadProjects();
        return;
      }

      try {

        const res = await fetch(
          `http://localhost:5000/api/projects/search?query=${query}`,
          {
            headers: {
              "Authorization": "Bearer " + token
            }
          }
        );

        const projects = await res.json();

        displayProjects(projects);

      } catch (err) {
        console.error("Search error:", err);
      }

    }, 400);
  });
}

// ================= LOAD PROJECTS =================
async function loadProjects() {

  const token = localStorage.getItem("token");

  try {

    const apiUrl = currentUser.role === "ADMIN"
      ? "http://localhost:5000/api/projects/all"
      : `http://localhost:5000/api/projects/${currentUser.email}`;

    const res = await fetch(apiUrl, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const projects = await res.json();

    window.allProjects = projects;

    displayProjects(projects);

    if (currentUser.role === "ADMIN") {
      loadUserFilter();
      setupFilterEvent();
    }

  } catch (err) {
    console.error(err);
    document.querySelector(".project-grid").innerHTML =
      "<p>Error loading projects ❌</p>";
  }
}

// ================= DISPLAY PROJECTS =================
function displayProjects(projects) {

  const grid = document.querySelector(".project-grid");
  grid.innerHTML = "";

  if (!projects || projects.length === 0) {
    grid.innerHTML = `
      <div class="project-card empty-card">
        <p>No projects found 🚀</p>
      </div>
    `;
    return;
  }

  projects.forEach(p => {

    let imgSrc = "images/default.png";

    if (p.image && !p.image.includes("default")) {
      imgSrc = `http://localhost:5000/uploads/${p.image}`;
    }

    const isOwner = p.userEmail === currentUser.email;
    const isAdmin = currentUser.role === "ADMIN";

    const card = document.createElement("div");
    card.className = "project-card";

    // 🔥 UI feel (optional but clean)
    if (isAdmin) {
      card.style.cursor = "default";
    }

    card.addEventListener("click", () => {
      openProject(p.id);
    });

    card.innerHTML = `
      ${(isOwner || isAdmin) ? `
        <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
      ` : ""}

      <img src="${imgSrc}" class="project-card-img">

      <div class="project-card-content">
        <h3>${p.name}</h3>

        <p>${p.description ? p.description.substring(0, 60) : ""}...</p>

        ${isAdmin ? `
          <div class="project-owner">
            👤 ${p.userEmail}
          </div>
        ` : ""}

        <div class="project-extra">

          <span class="status ${formatStatusClass(p.status)}">
            ${p.status || "No Status"}
          </span>

          <span class="deadline">
            ⏰ ${p.deadline || "No Date"}
          </span>

        </div>

      </div>
    `;

    const editBtn = card.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        editProject(p.id);
      });
    }

    const deleteBtn = card.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteProject(p.id);
      });
    }

    grid.appendChild(card);
  });

  if (currentUser.role !== "ADMIN") {

    const comingCard = document.createElement("div");
    comingCard.className = "project-card empty-card";

    comingCard.innerHTML = `
      <div class="project-card-content" style="text-align:center;">
        <h3>🚀 More Projects Coming Soon</h3>
        <p>Stay tuned for upcoming ideas!</p>
      </div>
    `;

    grid.appendChild(comingCard);
  }
}

// ================= STATUS FORMAT FUNCTION =================
function formatStatusClass(status) {
  if (!status) return "";

  status = status.toLowerCase();

  if (status.includes("track")) return "ontrack";
  if (status.includes("delay")) return "delayed";
  if (status.includes("progress")) return "progress";

  return "pending";
}

// ================= DELETE =================
async function deleteProject(id) {

  if (!confirm("Delete this project?")) return;

  const token = localStorage.getItem("token");

  try {
    await fetch(`http://localhost:5000/api/projects/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    loadProjects();

  } catch (err) {
    console.error(err);
    alert("Delete failed ❌");
  }
}

// ================= NAV =================
function editProject(id) {
  window.location.href = "editProject.html?id=" + id;
}

// 🔥 FINAL FIX HERE (ONLY CHANGE)
function openProject(id) {

  if (currentUser.role === "ADMIN") return;

  window.location.href = "dashboard.html?id=" + id;
}

// ================= ADMIN FILTER =================
function loadUserFilter() {

  const filter = document.getElementById("userFilter");
  if (!filter) return;

  filter.innerHTML = '<option value="all">All Users</option>';

  const users = [...new Set(window.allProjects.map(p => p.userEmail))];

  users.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    filter.appendChild(opt);
  });
}

function setupFilterEvent() {

  const filter = document.getElementById("userFilter");
  if (!filter) return;

  filter.addEventListener("change", function () {

    const selectedUser = this.value;

    if (selectedUser === "all") {
      displayProjects(window.allProjects);
      return;
    }

    const filtered = window.allProjects.filter(p => p.userEmail === selectedUser);
    displayProjects(filtered);
  });
}