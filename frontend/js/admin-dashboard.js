document.addEventListener("DOMContentLoaded", init);

let projectId = null;
let taskChart = null;
let barChart = null;
let lineChart = null;

// ================= INIT =================
async function init() {

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Login required ❌");
    window.location.href = "index.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  projectId = params.get("id");

  if (!projectId) {
    alert("No project selected ❌");
    window.location.href = "admin.html";
    return;
  }

  await loadProject();
  await refreshDashboard();

  setupLogout();

  setInterval(() => {
    refreshDashboard();
  }, 5000);
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

    if (p.userEmail) {
      const name = p.userEmail.split("@")[0];
      document.getElementById("projectOwner").textContent =
        name.charAt(0).toUpperCase() + name.slice(1);
    }

    if (p.deadline) {
      const dateOnly = p.deadline.split("T")[0];
      document.getElementById("projectDeadline").textContent = dateOnly;

      const diff = new Date(dateOnly) - new Date();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      document.getElementById("daysLeft").textContent =
        days > 0 ? `${days} days left` : "Deadline Passed ❌";
    }

    const statusEl = document.getElementById("healthStatus");

    if (p.status) {
      statusEl.textContent = p.status;

      if (p.status === "Completed") statusEl.style.color = "#00ff88";
      else if (p.status === "In Progress") statusEl.style.color = "#00aaff";
      else if (p.status === "Pending") statusEl.style.color = "#ffaa00";
      else if (p.status === "Delayed") statusEl.style.color = "#ff4d4d";
    }

    const modelViewer = document.getElementById("modelViewer");
    if (modelViewer) {
      modelViewer.src = getModelFromText(p.name + " " + (p.description || ""));
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

    const tasks = await res.json();

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "Completed").length;
    const inProgress = tasks.filter(t => t.status === "In Progress").length;
    const pending = tasks.filter(t => t.status === "Pending").length;

    const progress = total ? Math.round((completed / total) * 100) : 0;

    // STATS
    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("inProgressTasks").textContent = inProgress;
    document.getElementById("pendingTasks").textContent = pending;

    // ================= 🔥 NEW API CONNECT =================
    const progressRes = await fetch(`http://localhost:5000/api/progress/${projectId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });

    const progressData = await progressRes.json();

    // USE BACKEND DATA (NOT LOCAL CALC)
    document.getElementById("progressText").textContent =
      progressData.progressPercent + "% Completed";

    document.getElementById("progressBar").style.width =
      progressData.progressPercent + "%";

    // RISK (backend)
    const riskList = document.getElementById("riskList");
    riskList.innerHTML = "";

    const li = document.createElement("li");
    li.textContent = progressData.status;
    riskList.appendChild(li);

    // RECENT TASKS
    const recentList = document.getElementById("recentTasks");
    recentList.innerHTML = "";

    if (tasks.length === 0) {
      recentList.innerHTML = "<li>No tasks yet</li>";
    } else {
      tasks.slice(0, 5).forEach(t => {

        const title = t.title || t.name || "Task";

        const color =
          t.status === "Completed" ? "green" :
          t.status === "In Progress" ? "blue" : "orange";

        const li = document.createElement("li");

        li.innerHTML = `
          ${title}
          <span style="float:right;color:${color}">
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

    // BAR
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

    // LINE
    const trendData = [
      Math.max(progressData.progressPercent - 20, 0),
      Math.max(progressData.progressPercent - 10, 0),
      progressData.progressPercent
    ];

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(document.getElementById("progressLineChart"), {
      type: "line",
      data: {
        labels: ["Start", "Mid", "Now"],
        datasets: [{
          label: "Progress %",
          data: trendData,
          borderColor: "#00aaff",
          fill: false,
          tension: 0.4
        }]
      }
    });

    // TEAM
    document.getElementById("teamUtilization").innerHTML =
      total ? `${total} tasks assigned` : "No data";

    window._progress = progressData.progressPercent;

  } catch (err) {
    console.error(err);
  }
}

// ================= REFRESH =================
async function refreshDashboard() {
  await loadTasks();
  updateTimeline();
}

// ================= TIMELINE =================
function updateTimeline() {

  const timeline = document.getElementById("timelineStatus");
  if (!timeline) return;

  const p = window._progress || 0;

  if (p === 0) timeline.innerText = "✔ Planning";
  else if (p < 100) timeline.innerText = "✔ Execution";
  else timeline.innerText = "✔ Completed";
}

// ================= MODEL =================
function getModelFromText(text) {

  text = text.toLowerCase();

  if (text.includes("villa")) return "models/residential/villa1.glb";
  if (text.includes("apartment")) return "models/residential/apartment1.glb";
  if (text.includes("house")) return "models/residential/house1.glb";

  if (text.includes("office")) return "models/commercial/office1.glb";
  if (text.includes("mall")) return "models/commercial/mall1.glb";
  if (text.includes("hotel")) return "models/commercial/hotel1.glb";

  if (text.includes("hospital")) return "models/public/hospital1.glb";
  if (text.includes("school")) return "models/public/school1.glb";

  if (text.includes("factory")) return "models/industrial/factory1.glb";
  if (text.includes("warehouse")) return "models/industrial/warehouse1.glb";

  return "models/default/default.glb";
}

// ================= LOGOUT =================
function setupLogout() {
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "index.html";
  };
}