document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("taskForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first ❌");
      window.location.href = "index.html";
      return;
    }

    // 🔥 GET projectId from URL
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("projectId");

    if (!projectId) {
      alert("Project ID missing ❌");
      return;
    }

    console.log("Submitting form...");

    // 🔥 FORM DATA
    let status = document.getElementById("taskStatus").value;
    let progress = parseInt(document.getElementById("taskProgress").value) || 0;

    // 🔥 AUTO PROGRESS FIX (PRO FEATURE)
    if (status === "Completed") {
      progress = 100;
    }

    const taskData = {
      name: document.getElementById("taskName").value,
      description: document.getElementById("taskDesc").value,
      assignedTo: document.getElementById("taskAssigned").value,
      startDate: document.getElementById("taskStartDate").value,
      deadline: document.getElementById("taskDeadline").value,
      cost: parseFloat(document.getElementById("taskCost").value) || 0,
      priority: document.getElementById("taskPriority").value,
      status: status,
      progress: progress
    };

    console.log("Task Data:", taskData);

    try {

      const res = await fetch(`http://localhost:5000/api/tasks/add/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(taskData)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Server Error:", text);
        throw new Error("Failed to add task");
      }

      console.log("Task added successfully");

      // 🔥 SUCCESS UI IMPROVEMENT
      alert("Task Added Successfully ✅");

      // 🔥 RESET FORM (nice UX)
      form.reset();

      // 🔥 REDIRECT BACK TO SAME PROJECT DASHBOARD
      window.location.href = `dashboard.html?id=${projectId}`;

    } catch (err) {
      console.error("Error:", err);
      alert("Error adding task ❌");
    }

  });

});