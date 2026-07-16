document.addEventListener("DOMContentLoaded", () => {

  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  const BASE_URL = "http://localhost:5000/api/users";

  const showAlert = (message) => {
    alert(message);
  };

  // ================= REGISTER =================
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const company = document.getElementById("company").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();

      if (!name || !email || !company || !password || !confirmPassword) {
        showAlert("Please fill all fields!");
        return;
      }

      if (password.length < 6) {
        showAlert("Password must be at least 6 characters!");
        return;
      }

      if (password !== confirmPassword) {
        showAlert("Passwords do not match!");
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, company, password }),
        });

        const data = await res.json();

        if (res.ok) {
          showAlert("✅ Registration Successful! Please login now.");
          registerForm.reset();
          window.location.href = "index.html";
        } else {
          showAlert(data.message || "❌ Registration failed!");
        }

      } catch (error) {
        console.error(error);
        showAlert("⚠️ Server not running!");
      }
    });
  }

  // ================= LOGIN =================
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      if (!email || !password) {
        showAlert("Please fill all fields!");
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
          showAlert(data.message);

          // ✅ EXISTING (DO NOT CHANGE)
          localStorage.setItem("token", data.token);
          localStorage.setItem("email", email);

          // 🔥 NEW (SAFE ADD - chatbot साठी)
          localStorage.setItem("userEmail", email);

          // OPTIONAL
          if (data.role) {
            localStorage.setItem("role", data.role);
          }

          window.location.href = "projects.html";

        } else {
          showAlert("❌ Invalid credentials!");
        }

      } catch (error) {
        console.error(error);
        showAlert("⚠️ Server error!");
      }
    });
  }

});