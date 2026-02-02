import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { UserProvider } from "./contexts/UserContext";
import { TeamProvider } from "./contexts/TeamContext";
import "./index.css";
import "./responsive.css"; // Mobile responsive styles

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UserProvider>
      <TeamProvider>
        <App />
      </TeamProvider>
    </UserProvider>
  </React.StrictMode>
);
