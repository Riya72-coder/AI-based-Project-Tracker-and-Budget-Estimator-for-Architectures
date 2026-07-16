document.addEventListener("DOMContentLoaded", async function () {

  // ================= TOKEN CHECK =================
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("No token found");
    return;
  }

  // ================= FETCH USER =================
  try {
    const res = await fetch("http://localhost:5000/api/users/me", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Unauthorized");

    const user = await res.json();

    // ================= USER NAME =================
    const nameEl = document.getElementById("userName");
    if (nameEl) nameEl.textContent = user.name;

    // ================= PROFILE PIC =================
    const avatar = document.querySelector(".user-avatar");

    if (avatar) {
      avatar.src = (user.profilePic && user.profilePic !== "null")
        ? "http://localhost:5000/uploads/" + user.profilePic
        : "images/default-user.png";
    }

  } catch (err) {
    console.error("❌ User fetch failed:", err);
    localStorage.clear();
    window.location.href = "index.html";
  }

  // ================= 🔥 NAVBAR LINKS FIX =================
  try {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("projectId") || params.get("id");

    if (projectId) {

      const dashboardLink = document.getElementById("dashboardNavLink");
      const addTaskLink = document.getElementById("addTaskNav");
      const manageLink = document.getElementById("manageTaskNav");
      const logo = document.getElementById("logoLink");

      if (dashboardLink)
        dashboardLink.href = `dashboard.html?id=${projectId}`;

      if (addTaskLink)
        addTaskLink.href = `addTask.html?projectId=${projectId}`;

      if (manageLink)
        manageLink.href = `manageTasks.html?projectId=${projectId}`;

      if (logo)
        logo.href = `dashboard.html?id=${projectId}`;
    }

  } catch (err) {
    console.error("Navbar link error:", err);
  }

  // ================= 🔥 PROFILE CLICK (NEW FIX) =================
  const profileBtn = document.getElementById("profileBtn");

  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  // ================= LOGOUT =================
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "index.html";
    });
  }

});