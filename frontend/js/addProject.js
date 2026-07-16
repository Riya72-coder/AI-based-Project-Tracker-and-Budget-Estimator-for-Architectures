document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("projectForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const msg = document.getElementById("successMsg");
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first ❌");
      window.location.href = "index.html";
      return;
    }

    const formData = new FormData();

    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;
    const deadline = document.getElementById("deadline").value;
    let status = document.getElementById("status").value;

    // 🔥 AUTO DELAY LOGIC
    const today = new Date().toISOString().split("T")[0];
    if (deadline < today && status !== "Completed") {
      status = "Delayed";
    }

    formData.append("name", name);
    formData.append("description", description);
    formData.append("deadline", deadline);
    formData.append("status", status);

    const imageFile = document.getElementById("image").files[0];
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {

      const res = await fetch("http://localhost:5000/api/projects/add", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token
        },
        body: formData
      });

      const data = await res.text();

      if (res.ok) {

        console.log("✅ Project Saved:", data);
        msg.style.display = "block";

        setTimeout(() => {
          window.location.href = "projects.html";
        }, 2000);

      } else {
        alert("❌ " + data);
      }

    } catch (err) {
      console.error(err);
      alert("Server error ❌");
    }

  });

});