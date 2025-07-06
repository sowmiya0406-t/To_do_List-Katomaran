import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "./Dashboard.css";
import { getAuth } from "firebase/auth";

function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [userName, setUserName] = useState("User");
  const [userData, setUserData] = useState({ name: "User", email: "user@mail.com" });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const fetchTasks = (userId) => {
    setLoading(true);
    fetch(`http://localhost:5000/api/tasks?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          console.error("Unexpected response format:", data);
          setError("Failed to load tasks.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch tasks:", err);
        setError("Server error while fetching tasks.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem("user"));
    const authUser = getAuth().currentUser;
    const userId = localUser?.user_id || authUser?.uid;

    if (userId) {
      setUserName(localUser?.name || authUser?.displayName || "User");
      setUserData({
        displayName: localUser?.name || authUser?.displayName || "User",
        email: localUser?.email || authUser?.email || "user@mail.com",
      });

      fetchTasks(userId); 
    }
  }, []);

  const updateTaskStatus = (taskId, newStatus) => {
    fetch("http://localhost:5000/api/updateTask", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: newStatus }),
    })
      .then((res) => res.json())
      .then(() => {
        const userId = JSON.parse(localStorage.getItem("user"))?.user_id;
        fetchTasks(userId); 
      })
      .catch((err) => console.error("Status update failed:", err));
  };

  const filteredTasks = tasks.filter((task) => {
    const dueDate = formatDate(task.due_date);
    if (filter === "today") return dueDate === today;
    if (filter === "overdue") return dueDate && dueDate < today;
    if (["high", "medium", "low"].includes(filter)) return task.priority === filter;
    if (["todo", "inProgress", "done"].includes(filter)) return task.status === filter;
    return true; 
  });

  const taskStatusCounts = {
    completed: tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "inProgress").length,
    todo: tasks.filter((t) => t.status === "todo").length,
  };

  const total = tasks.length || 1;

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-wrapper">
      <Navbar user={userData} onLogout={handleLogout} />

      <main className="dashboard-main" style={{ marginLeft: "250px" }}>
        <div className="dashboard-header">
          <h1>Welcome back, {userName} 👋</h1>
          <span>{new Date().toLocaleDateString()}</span>
        </div>

        <section className="filters">
          {["all", "today", "overdue", "high", "medium", "low", "todo", "inProgress", "done"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={filter === type ? "active" : ""}
            >
              {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1")}
            </button>
          ))}
        </section>

        {loading ? (
          <p>Loading tasks...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="task-area">
            <div className="task-column">
              <h2>📝 To-Do</h2>
              {filteredTasks
                .filter((t) => t.status === "todo")
                .map((task) => (
                  <div key={task.id} className="task-card">
                    <h3>{task.text}</h3>
                    <p>{task.description || "No description provided."}</p>
                    <p>Due: {formatDate(task.due_date) || "None"}</p>
                    <p>Priority: {task.priority || "N/A"}</p>
                    <button onClick={() => updateTaskStatus(task.id, "inProgress")}>Mark In Progress</button>
                  </div>
                ))}
            </div>

            <div className="task-column">
              <h2>🚧 In Progress</h2>
              {filteredTasks
                .filter((t) => t.status === "inProgress")
                .map((task) => (
                  <div key={task.id} className="task-card in-progress">
                    <h3>{task.text}</h3>
                    <p>{task.description || "No description provided."}</p>
                    <p>Due: {formatDate(task.due_date) || "None"}</p>
                    <p>Priority: {task.priority || "N/A"}</p>
                    <button onClick={() => updateTaskStatus(task.id, "done")}>Mark Done</button>
                  </div>
                ))}
            </div>

            <div className="task-column">
              <h2>✅ Completed</h2>
              {filteredTasks
                .filter((t) => t.status === "done")
                .map((task) => (
                  <div key={task.id} className="task-card completed">
                    <h3>{task.text}</h3>
                    <p>{task.description || "No description provided."}</p>
                    <p className="status">Done ✅</p>
                    <p>Due: {formatDate(task.due_date) || "None"}</p>
                    <p>Priority: {task.priority || "N/A"}</p>
                  </div>
                ))}
            </div>

            <div className="task-column">
              <h2>📊 Task Status</h2>
              <div className="task-status-chart">
                <div className="status-metrics">
                  <div>
                    <span className="completed">
                      {((taskStatusCounts.completed / total) * 100).toFixed(0)}%
                    </span>
                    <p>Completed</p>
                  </div>
                  <div>
                    <span className="in-progress">
                      {((taskStatusCounts.inProgress / total) * 100).toFixed(0)}%
                    </span>
                    <p>In Progress</p>
                  </div>
                  <div>
                    <span className="not-started">
                      {((taskStatusCounts.todo / total) * 100).toFixed(0)}%
                    </span>
                    <p>To-Do</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
