import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Application root element was not found.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
