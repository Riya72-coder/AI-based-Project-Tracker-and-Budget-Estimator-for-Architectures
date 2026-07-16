document.addEventListener("DOMContentLoaded", init);

let projectId = null;

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

  loadProject();
  setupUpdate();
}

// ================= LOAD PROJECT =================
async function loadProject() {

  const token = localStorage.getItem("token");

  try {

    const userRes = await fetch("http://localhost:5000/api/users/me", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const user = await userRes.json();

    const apiUrl = user.role === "ADMIN"
      ? "http://localhost:5000/api/projects/all"
      : `http://localhost:5000/api/projects/${user.email}`;

    const res = await fetch(apiUrl, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const projects = await res.json();

    const p = projects.find(proj => proj.id == projectId);

    if (!p) {
      alert("Project not found ❌");
      return;
    }

    document.getElementById("name").value = p.name || "";
    document.getElementById("description").value = p.description || "";

    if (p.deadline) {
      document.getElementById("deadline").value = p.deadline.split("T")[0];
    }

    // ✅ STATUS FIX
    document.getElementById("status").value = p.status || "Pending";

  } catch (err) {
    console.error(err);
    alert("Error loading project ❌");
  }
}

// ================= UPDATE =================
function setupUpdate() {

  const form = document.getElementById("editForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const formData = new FormData();

    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;
    const deadline = document.getElementById("deadline").value;
    let status = document.getElementById("status").value;

    // 🔥 AUTO DELAY LOGIC
    const today = new Date().toISOString().split("T")[0];
    if (deadline && deadline < today && status !== "Completed") {
      status = "Delayed";
    }

    formData.append("name", name);
    formData.append("description", description);
    formData.append("deadline", deadline);
    formData.append("status", status);

    const file = document.getElementById("image").files[0];
    if (file) {
      formData.append("image", file);
    }

    try {

      const res = await fetch(`http://localhost:5000/api/projects/update/${projectId}`, {
        method: "PUT",
        headers: {
          "Authorization": "Bearer " + token
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }

      alert("Project Updated Successfully ✅");
      window.location.href = "projects.html";

    } catch (err) {
      console.error(err);
      alert("Update failed ❌");
    }

  });
}