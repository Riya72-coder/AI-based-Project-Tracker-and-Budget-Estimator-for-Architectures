document.addEventListener("DOMContentLoaded", init);

let projectId = null;
let currentUser = null;
let taskChart = null;
let barChart = null;      // 🔥 NEW
let lineChart = null;     // 🔥 NEW

const role = localStorage.getItem("role");
const viewMode = localStorage.getItem("viewMode");

// ================= INIT =================
async function init() {

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first ❌");
    window.location.href = "index.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  projectId = params.get("id");

  if (!projectId) {
    alert("No project selected ❌");
    window.location.href = "projects.html";
    return;
  }

  await loadUser();

  document.getElementById("addTaskNav").href = `addTask.html?projectId=${projectId}`;
  document.getElementById("manageTaskNav").href = `manageTasks.html?projectId=${projectId}`;

  await loadProject();

  if (role === "ADMIN" && viewMode === "admin") {
    enableAdminViewMode();
  }

  await refreshDashboard();

  window.addEventListener("focus", refreshDashboard);

  setupLogout();
  setupEstimator();
}

// ================= REFRESH =================
async function refreshDashboard() {
  await loadTasks();
  updateTimeline();
}

// ================= USER =================
async function loadUser() {
  try {
    const res = await fetch("http://localhost:5000/api/users/me", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });

    currentUser = await res.json();
    document.getElementById("userName").textContent = currentUser.name;

  } catch (err) {
    console.error(err);
  }
}

// ================= MODEL =================
function getModelFromText(text) {

  text = text.toLowerCase();

  const words = text.replace(/[^a-z0-9 ]/g, "").split(/\s+/);
  const has = (w) => words.includes(w);

  if (has("school")) return "models/public/school1.glb";
  if (has("college")) return "models/public/college1.glb";
  if (has("hospital")) return "models/public/hospital1.glb";

  if (has("hotel")) return "models/commercial/hotel1.glb";
  if (has("mall")) return "models/commercial/mall1.glb";
  if (has("office")) return "models/commercial/office1.glb";

  if (has("warehouse")) return "models/industrial/warehouse1.glb";
  if (has("factory")) return "models/industrial/factory1.glb";

  if (has("villa")) return "models/residential/villa1.glb";
  if (has("apartment") || has("flat")) return "models/residential/apartment1.glb";

  if (text.includes("residential complex"))
    return "models/residential/apartment1.glb";

  if (has("house") || has("home"))
    return "models/residential/house1.glb";

  if (has("interior") || has("room") || has("3bhk"))
    return "models/interior/room1.glb";

  if (has("bridge")) return "models/construction/bridge1.glb";
  if (has("road")) return "models/construction/road1.glb";
  if (has("building")) return "models/construction/building1.glb";

  if (has("garden")) return "models/outdoor/garden1.glb";
  if (has("park")) return "models/outdoor/park1.glb";

  return "models/default/default.glb";
}

// ================= PROJECT =================
async function loadProject() {

  try {

    const res = await fetch(`http://localhost:5000/api/projects/id/${projectId}`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });

    const p = await res.json();

    document.getElementById("projectName").textContent = p.name;
    document.getElementById("projectDesc").textContent = p.description || "";

    const ownerEl = document.getElementById("projectOwner");
    if (ownerEl && p.userEmail) {
      const name = p.userEmail.split("@")[0];
      ownerEl.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    }

    if (p.deadline) {
      const dateOnly = p.deadline.split("T")[0];
      document.getElementById("projectDeadline").textContent = dateOnly;

      const diff = new Date(dateOnly) - new Date();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      const el = document.getElementById("daysLeft");

      if (days < 0) {
        el.textContent = "🚨 Deadline Passed";
        el.style.color = "red";
      } else if (days <= 2) {
        el.textContent = `⚠️ ${days} days left`;
        el.style.color = "orange";
      } else {
        el.textContent = `${days} days left`;
      }
    }

    const statusEl = document.getElementById("healthStatus");

    if (statusEl && p.status) {
      statusEl.textContent = p.status;

      if (p.status === "Completed") statusEl.style.color = "#00ff88";
      else if (p.status === "In Progress") statusEl.style.color = "#00aaff";
      else if (p.status === "Pending") statusEl.style.color = "#ffaa00";
      else if (p.status === "Delayed") statusEl.style.color = "#ff4d4d";
    }

    const modelViewer = document.getElementById("modelViewer");

    if (modelViewer) {
      const text = p.name + " " + (p.description || "");
      const modelPath = getModelFromText(text);

      modelViewer.src = modelPath;

      modelViewer.onerror = () => {
        modelViewer.src = "models/default/default.glb";
      };
    }

  } catch (err) {
    console.error(err);
  }
}

// ================= TASKS =================
async function loadTasks() {

  try {

    const res = await fetch(`http://localhost:5000/api/tasks/project/${projectId}`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });

    let tasks = await res.json();

    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "Completed").length;
    const inProgress = tasks.filter(t => t.status === "In Progress").length;
    const pending = tasks.filter(t => t.status === "Pending").length;

    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;

    const inProgressEl = document.getElementById("inProgressTasks");
    if (inProgressEl) inProgressEl.textContent = inProgress;

    document.getElementById("progressText").textContent = progress + "% Completed";

    const bar = document.getElementById("progressBar");
    bar.style.width = progress + "%";
    bar.style.background = "#00aaff";

    const riskList = document.getElementById("riskList");
    if (riskList) {
      riskList.innerHTML = "";

      let risk = "Low Risk ✅";
      if (progress < 30) risk = "High Risk ❌";
      else if (progress < 70) risk = "Medium Risk ⚠️";

      const li = document.createElement("li");
      li.textContent = risk;
      riskList.appendChild(li);
    }

    const recentList = document.getElementById("recentTasks");
    recentList.innerHTML = "";

    if (tasks.length === 0) {
      recentList.innerHTML = "<li>No tasks yet</li>";
    } else {
      tasks.slice(0, 5).forEach(t => {

        const statusColor =
          t.status === "Completed" ? "green" :
          t.status === "In Progress" ? "blue" : "orange";

        const li = document.createElement("li");

        li.innerHTML = `
          ${t.title || t.name}
          <span style="float:right;color:${statusColor}">
            ${t.status}
          </span>
        `;

        recentList.appendChild(li);
      });
    }

    // DOUGHNUT
    if (taskChart) taskChart.destroy();
    taskChart = new Chart(document.getElementById("taskChart"), {
      type: "doughnut",
      data: {
        labels: ["Completed", "In Progress", "Pending"],
        datasets: [{
          data: [completed, inProgress, pending],
          backgroundColor: ["#00aaff", "#ffaa00", "#444"]
        }]
      }
    });

    // 🔥 BAR
    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById("taskBarChart"), {
      type: "bar",
      data: {
        labels: ["Completed", "In Progress", "Pending"],
        datasets: [{
          label: "Tasks",
          data: [completed, inProgress, pending],
          backgroundColor: ["#00ff88", "#00aaff", "#ffaa00"]
        }]
      }
    });

    // 🔥 LINE
    if (lineChart) lineChart.destroy();
    lineChart = new Chart(document.getElementById("progressLineChart"), {
      type: "line",
      data: {
        labels: ["Start", "Mid", "Now"],
        datasets: [{
          label: "Progress %",
          data: [Math.max(progress - 20, 0), Math.max(progress - 10, 0), progress],
          borderColor: "#00aaff",
          fill: false,
          tension: 0.4
        }]
      }
    });

    const teamBox = document.getElementById("teamUtilization");
    if (teamBox) {
      teamBox.innerHTML = `<p>${total} tasks assigned</p>`;
    }

    window._progress = progress;

  } catch (err) {
    console.error(err);
  }
}

// ================= TIMELINE =================
function updateTimeline() {

  const timeline = document.getElementById("timelineStatus");
  if (!timeline) return;

  const progress = window._progress || 0;

  let stage = "Planning";

  if (progress === 0) stage = "Planning";
  else if (progress < 100) stage = "Execution";
  else stage = "Completed";

  timeline.innerText = "✔ " + stage;
}

// ================= ADMIN =================
function enableAdminViewMode() {

  document.getElementById("addTaskNav")?.remove();
  document.getElementById("manageTaskNav")?.remove();

  document.querySelectorAll("button").forEach(btn => {
    if (!btn.innerText.toLowerCase().includes("logout")) {
      btn.disabled = true;
      btn.style.opacity = "0.6";
    }
  });

  const banner = document.createElement("div");
  banner.innerText = "👁️ Admin View (Read Only)";
  banner.style.cssText = `
    background: red;
    color: white;
    padding: 10px;
    text-align: center;
    border-radius: 8px;
  `;

  document.querySelector("main").prepend(banner);
}

// ================= LOGOUT =================
function setupLogout() {
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "index.html";
  };
}

// ================= ESTIMATOR =================
function setupEstimator() {

  document.getElementById("estimateBtn").onclick = () => {

    const type = document.getElementById("projectType").value;
    const area = parseFloat(document.getElementById("area").value);

    if (!type || !area) {
      alert("Enter details ❌");
      return;
    }

    let rate = type === "Residential" ? 1500 : 2500;
    const cost = area * rate;

    document.getElementById("estimateResult").textContent =
      "Estimated Cost: ₹ " + cost.toLocaleString();
  };
}