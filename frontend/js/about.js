document.addEventListener("DOMContentLoaded", () => {

  const navRight = document.getElementById("nav-right");
  const token = localStorage.getItem("token");

  // ================= NAVBAR =================
  let html = `
    <a href="about-team.html" class="active">About</a>
    <a href="projects.html">Projects</a>
    <a href="contact.html">Contact</a>
  `;

  if (token) {
    html += `
      <i class="fa-solid fa-right-from-bracket logout-icon" id="logoutBtn"></i>
    `;
  } else {
    html += `
      <a href="login.html" class="btn-nav">Login</a>
    `;
  }

  navRight.innerHTML = html;

  // Logout
  if (token) {
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  }

  // ================= SMOOTH SCROLL =================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // ================= SCROLL ANIMATION =================
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".hidden").forEach(el => {
    observer.observe(el);
  });

  // 🔥 LOAD DYNAMIC STATS
  loadStats();

});

// ================= 🔥 SMART DYNAMIC =================
async function loadStats() {
  try {

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/admin/stats", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await res.json();

    // ✅ REAL PROJECTS
    document.getElementById("projectsCount").textContent = data.projects;

    // ✅ DEVELOPERS (users count logic)
    document.getElementById("developersCount").textContent = data.users;

    // ✅ SUCCESS RATE (simple logic)
    let success = 90;
    if (data.projects > 10) success = 95;
    if (data.projects > 20) success = 98;

    document.getElementById("successRate").textContent = success + "%";

    // ✅ SUPPORT (dynamic text)
    document.getElementById("support").textContent = "24/7";

  } catch (err) {
    console.error("Stats load error:", err);
  }
}