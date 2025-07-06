import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import LoginPage from "./LoginPage.jsx";
import KanbanBoard from "./KanbanBoard.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Navbar from "./components/Navbar.jsx";
import { KanbanContext } from "./KanbanContext";

const App = () => {
  const [user, setUser] = useState(null);

  const [state, setState] = useState({
    todo: [],
    inProgress: [],
    done: [],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setUser({ ...firebaseUser, token });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch(() => {});
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <Router>
      {user && <Navbar user={user} onLogout={handleLogout} />}

      {!user ? (
        <Routes>
          <Route path="*" element={<LoginPage onLogin={setUser} />} />
        </Routes>
      ) : (
        <KanbanContext.Provider value={{ state, setState }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </KanbanContext.Provider>
      )}
    </Router>
  );
};

export default App;
