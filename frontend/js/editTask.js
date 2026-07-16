document.addEventListener("DOMContentLoaded", async () => {

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first ❌");
    window.location.href = "index.html";
    return;
  }

  // 🔥 GET FROM URL (FINAL FIX)
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get("id");
  const projectId = params.get("projectId");

  console.log("Task ID:", taskId);
  console.log("Project ID:", projectId);

  if (!taskId || !projectId) {
    alert("Invalid access ❌");
    window.location.href = "projects.html";
    return;
  }

  // ================= LOAD TASK =================
  try {

    const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch task");
    }

    const task = await res.json();

    document.getElementById("taskName").value = task.name || "";
    document.getElementById("taskDesc").value = task.description || "";
    document.getElementById("taskAssigned").value = task.assignedTo || "";
    document.getElementById("taskStartDate").value = task.startDate || "";
    document.getElementById("taskDeadline").value = task.deadline || "";
    document.getElementById("taskCost").value = task.cost || 0;
    document.getElementById("taskPriority").value = task.priority || "Medium";
    document.getElementById("taskStatus").value = task.status || "Pending";
    document.getElementById("taskProgress").value = task.progress || 0;

  } catch (err) {
    console.error(err);
    alert("Error loading task ❌");
  }

  // ================= UPDATE TASK =================
  document.getElementById("editForm")
    .addEventListener("submit", async function (e) {

      e.preventDefault();

      const updatedTask = {
        name: document.getElementById("taskName").value,
        description: document.getElementById("taskDesc").value,
        assignedTo: document.getElementById("taskAssigned").value,
        startDate: document.getElementById("taskStartDate").value,
        deadline: document.getElementById("taskDeadline").value,
        cost: parseFloat(document.getElementById("taskCost").value) || 0,
        priority: document.getElementById("taskPriority").value,
        status: document.getElementById("taskStatus").value,
        progress: parseInt(document.getElementById("taskProgress").value) || 0,
        projectId: parseInt(projectId)
      };

      try {

        const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify(updatedTask)
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Server Error:", text);
          throw new Error("Update failed");
        }

        alert("Task Updated Successfully ✅");

        // 🔥 BACK TO SAME PROJECT
        window.location.href = `manageTasks.html?projectId=${projectId}`;

      } catch (err) {
        console.error(err);
        alert("Error updating task ❌");
      }

    });

});