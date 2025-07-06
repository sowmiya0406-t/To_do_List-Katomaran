import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside
      style={{
        ...styles.sidebar,
        ...(isMobile ? styles.sidebarMobile : {}),
      }}
    >
      <div style={styles.profileSection}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          alt="Profile"
          style={styles.profileImage}
        />
        <h3 style={styles.userName}>{user.displayName || "User"}</h3>
        <p style={styles.email}>{user.email || "user@mail.com"}</p>
      </div>

      <nav style={styles.navLinks}>
        <Link
          to="/dashboard"
          style={{
            ...styles.link,
            ...(location.pathname === "/dashboard" ? styles.active : {}),
          }}
        >
          🏠 Dashboard
        </Link>

        <Link
          to="/kanban"
          style={{
            ...styles.link,
            ...(location.pathname === "/kanban" ? styles.active : {}),
          }}
        >
          📋 Kanban Board
        </Link>

        <Link
          to="/settings"
          style={{
            ...styles.link,
            ...(location.pathname === "/settings" ? styles.active : {}),
          }}
        >
          ⚙️ Settings
        </Link>

        <Link
          to="/help"
          style={{
            ...styles.link,
            ...(location.pathname === "/help" ? styles.active : {}),
          }}
        >
          ❓ Help
        </Link>
      </nav>

      <button style={styles.logoutBtn} onClick={onLogout}>
        🚪 Logout
      </button>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "250px",
    backgroundColor: "#ff5757",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "1rem 0",
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
  },
  profileSection: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  profileImage: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  userName: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    margin: "0.5rem 0 0.25rem",
  },
  email: {
    fontSize: "0.85rem",
    opacity: 0.9,
  },
  navLinks: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    paddingLeft: "1rem",
    gap: "0.5rem",
  },
  link: {
    textDecoration: "none",
    color: "#fff",
    padding: "0.75rem 1rem",
    borderRadius: "0 1rem 1rem 0",
    fontWeight: "500",
    transition: "background-color 0.3s",
  },
  active: {
    backgroundColor: "#ff8c8c",
  },
  logoutBtn: {
    marginTop: "auto",
    padding: "0.6rem 1.2rem",
    backgroundColor: "#fff",
    color: "#ff5757",
    border: "none",
    borderRadius: "2rem",
    cursor: "pointer",
    fontWeight: "bold",
  },
  sidebarMobile: {
  width: "100%",
  height: "auto",
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-around",
  alignItems: "center",
  position: "static",
  padding: "1rem",
  boxShadow: "none",
},

};

export default Navbar;
