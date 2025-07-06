import React, { createContext, useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const user = getAuth().currentUser;
    if (!user) return;

    try {
      const res = await fetch(`http://localhost:5000/api/tasks?user_id=${user.uid}`);
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
      else console.error("Invalid task format:", data);
    } catch (err) {
      console.error("❌ Failed to fetch tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, setTasks, fetchTasks }}>
      {children}
    </TaskContext.Provider>
  );
};
