import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";
import "./LoginPage.css";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      const user = result.user;

      await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          username: user.displayName,
          email: user.email,
        }),
      });

      onLogin(user, token); 
    } catch (err) {
      alert("Google login failed");
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/manual-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      alert("Login successful!");
      console.log("User saved:", data);

      const simulatedUser = {
        displayName: username,
        email: email,
        uid: data?.uid || null,
      };

      onLogin(simulatedUser, null); 
    } catch (err) {
      alert("Error: " + err.message);
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🧠 Task Manager</h1>
        <p>Login to manage your tasks</p>
        <form onSubmit={handleFormSubmit} className="manual-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Login with Username</button>
        </form>

        <hr />
        <button onClick={handleGoogleLogin} className="login-btn">
          <img
            className="google-icon"
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google icon"
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
