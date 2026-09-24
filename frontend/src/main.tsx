import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";
import "./experience-nav.css";
import "./app/dictionary.css";

const root = document.getElementById("root");
if (!root) throw new Error("KANJI5_REACT_ROOT_REQUIRED");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);