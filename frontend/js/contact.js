document.addEventListener("DOMContentLoaded", () => {

  const navRight = document.getElementById("nav-right");
  const token = localStorage.getItem("token");

  // ================= NAVBAR =================
  let html = `
    <a href="about-team.html">About</a>
    <a href="projects.html">Projects</a>
    <a href="contact.html" class="active">Contact</a>
  `;

  if (token) {
    html += `<i class="fa-solid fa-right-from-bracket logout-icon" id="logoutBtn"></i>`;
  } else {
    html += `<a href="login.html" class="btn-nav">Login</a>`;
  }

  navRight.innerHTML = html;

  // Logout
  if (token) {
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  }

  // ================= CONTACT FORM =================
  const form = document.getElementById("contactForm");
  const msgStatus = document.getElementById("msgStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = {
      name: document.getElementById("contactName").value.trim(),
      email: document.getElementById("contactEmail").value.trim(),
      message: document.getElementById("contactMessage").value.trim()
    };

    try {
      const res = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
      });

      if (!res.ok) throw new Error("Failed");

      // Success message
      msgStatus.textContent = "✅ Message sent successfully!";
      form.reset();

    } catch (err) {
      msgStatus.textContent = "❌ Failed to send message";
    }

    setTimeout(() => {
      msgStatus.textContent = "";
    }, 3000);
  });

});