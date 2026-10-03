import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { ReactErrorBoundary } from "./app/ReactErrorBoundary";
import "vazirmatn/Vazirmatn-Variable-font-face.css";
import "./plus-jakarta.css";
import "./styles.css";
import "./experience-nav.css";
import "./app/dictionary.css";
import "./app/exercise-layout.css";
import "./visual-polish.css";

const root = document.getElementById("root");
if (!root) throw new Error("KANJI5_REACT_ROOT_REQUIRED");

createRoot(root).render(
  <StrictMode>
    <ReactErrorBoundary>
      <App />
    </ReactErrorBoundary>
  </StrictMode>,
);