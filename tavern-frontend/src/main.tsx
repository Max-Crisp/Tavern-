import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Protected from "./components/Protected";
import AdventurerLeaderboard from "./pages/AdventurerLeaderboard";


const router = createBrowserRouter([
  // public routes
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  // protected app root
  {
    path: "/",
    element: (
      <Protected>
        <Dashboard />
      </Protected>
    ),
  },
  {
    path: "/leaderboard",
    element: (
      <Protected>
        <AdventurerLeaderboard />
      </Protected>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
