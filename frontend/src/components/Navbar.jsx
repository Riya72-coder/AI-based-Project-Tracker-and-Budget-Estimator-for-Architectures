import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const viewMode = localStorage.getItem("viewMode");

  // Extract active project id from query params or path params
  const queryParams = new URLSearchParams(location.search);
  const activeProjectId = projectId || queryParams.get("projectId") || queryParams.get("id");

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/users/me", {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        loadNotifications(data);
      })
      .catch((err) => {
        console.error("❌ User fetch failed:", err);
        localStorage.clear();
        navigate("/login");
      });
  }, [token]);

  // Periodic notification fetch
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      loadNotifications(user);
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async (currentUser) => {
    if (!currentUser) return;
    try {
      let url = "";
      if (currentUser.role === "ADMIN") {
        url = "http://localhost:5000/api/notifications/admin";
      } else {
        url = `http://localhost:5000/api/notifications/${currentUser.email}`;
      }

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data || []);
    } catch (err) {
      console.error("Notification load error:", err);
    }
  };

  const handleReadNotification = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/read/${id}`, {
        method: "PUT",
      });
      // Refresh notifications list
      loadNotifications(user);
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate("/login");
  };

  const avatarUrl = user?.profilePic && user.profilePic !== "null"
    ? `http://localhost:5000/uploads/${user.profilePic}`
    : "/images/logo.png"; // Fallback

  const unreadCount = notifications.length;

  return (
    <nav className="navbar">
      <div className="logo" style={{ cursor: "pointer" }} onClick={() => navigate(activeProjectId ? `/dashboard/${activeProjectId}` : "/projects")}>
        <img src="/images/logo.png" className="logo-img" alt="Logo" />
        <h1>AI Project Tracker</h1>
      </div>

      {token && (
        <ul className="nav-links">
          {activeProjectId ? (
            <>
              <li>
                <Link 
                  to={viewMode === "admin" ? `/dashboard/${activeProjectId}?id=${activeProjectId}` : `/dashboard/${activeProjectId}`}
                  className={location.pathname.startsWith("/dashboard") ? "active" : ""}
                >
                  Dashboard
                </Link>
              </li>
              {viewMode !== "admin" && (
                <>
                  <li>
                    <Link 
                      to={`/tasks/manage/${activeProjectId}`}
                      className={location.pathname.startsWith("/tasks/manage") ? "active" : ""}
                    >
                      Manage Tasks
                    </Link>
                  </li>
                </>
              )}
            </>
          ) : (
            <>
              <li>
                <Link to="/projects" className={location.pathname === "/projects" ? "active" : ""}>
                  Projects
                </Link>
              </li>
              {role === "ADMIN" && (
                <li>
                  <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""}>
                    Admin Panel
                  </Link>
                </li>
              )}
            </>
          )}
          <li>
            <Link to="/about" className={location.pathname === "/about" ? "active" : ""}>
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" className={location.pathname === "/contact" ? "active" : ""}>
              Contact
            </Link>
          </li>
        </ul>
      )}

      {token && user && (
        <div className="navbar-user">
          <span>👋 Welcome <span id="userName" style={{ fontWeight: 600 }}>{user.name}</span></span>
          
          {/* NOTIFICATION BELL */}
          <div style={{ position: "relative" }}>
            <a href="#" id="bellIcon" onClick={(e) => { e.preventDefault(); setShowNotifDropdown(!showNotifDropdown); }}>
              <i className="fa-regular fa-bell" style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}></i>
              {unreadCount > 0 && (
                <span id="notifCount" className="notif-count" style={{ display: "inline-block" }}>
                  {unreadCount}
                </span>
              )}
            </a>

            {/* DROPDOWN */}
            {showNotifDropdown && (
              <div id="notifDropdown" className="notif-dropdown" style={{ display: "block" }}>
                <ul id="notifList">
                  {notifications.length === 0 ? (
                    <li className="empty">No notifications</li>
                  ) : (
                    notifications.map((n) => (
                      <li key={n.id} onClick={() => handleReadNotification(n.id)}>
                        {n.message}
                        <br />
                        <small>{new Date(n.createdAt).toLocaleString()}</small>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <img 
            src={avatarUrl} 
            className="user-avatar" 
            id="profileBtn" 
            alt="Avatar"
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
          />
          <a href="#" id="logoutBtn" onClick={handleLogout} title="Logout">
            <i className="fa-solid fa-right-from-bracket"></i>
          </a>
        </div>
      )}
    </nav>
  );
}
