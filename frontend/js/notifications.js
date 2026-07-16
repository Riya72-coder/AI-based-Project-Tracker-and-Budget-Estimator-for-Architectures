document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");

  const bell = document.getElementById("bellIcon");
  const list = document.getElementById("notifList");
  const count = document.getElementById("notifCount");
  const box = document.getElementById("notifDropdown");

  // 🔥 SAFETY CHECK
  if (!bell || !list || !count || !box) {
    console.log("Notification elements missing ❌");
    return;
  }

  if (!email) {
    console.log("User email not found ❌");
    return;
  }

  // ================= LOAD =================
  async function loadNotifications() {

    try {
      let url = "";

      // 🔥 ADMIN vs USER
      if (role === "ADMIN") {
        url = "http://localhost:5000/api/notifications/admin";
      } else {
        url = `http://localhost:5000/api/notifications/${email}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        console.log("API error ❌");
        return;
      }

      const data = await res.json();

      list.innerHTML = "";

      // 🔥 NO NOTIFICATIONS
      if (!data || data.length === 0) {
        list.innerHTML = "<li class='empty'>No notifications</li>";
        count.style.display = "none";
        return;
      }

      let unread = data.length; // read = delete

      data.forEach(n => {

        const li = document.createElement("li");

        li.innerHTML = `
          ${n.message}
          <br>
          <small>${new Date(n.createdAt).toLocaleString()}</small>
        `;

        // 🔥 CLICK = DELETE
        li.onclick = async () => {
          try {
            await fetch(`http://localhost:5000/api/notifications/read/${n.id}`, {
              method: "PUT"
            });

            loadNotifications(); // refresh
          } catch (err) {
            console.log("Delete error:", err);
          }
        };

        list.appendChild(li);
      });

      // 🔴 BADGE COUNT
      count.textContent = unread;
      count.style.display = unread === 0 ? "none" : "inline-block";

    } catch (err) {
      console.error("Notification error:", err);
    }
  }

  // ================= TOGGLE =================
  bell.onclick = (e) => {
    e.preventDefault();

    box.style.display =
      box.style.display === "block" ? "none" : "block";
  };

  // ================= CLOSE ON OUTSIDE CLICK =================
  document.addEventListener("click", (e) => {
    if (!bell.contains(e.target) && !box.contains(e.target)) {
      box.style.display = "none";
    }
  });

  // ================= AUTO LOAD =================
  loadNotifications();
  setInterval(loadNotifications, 5000);

});