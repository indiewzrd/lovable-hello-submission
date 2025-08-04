console.log("main.tsx: Starting import of React");
import { StrictMode } from "react";
console.log("main.tsx: React imported successfully");

console.log("main.tsx: Starting import of react-dom/client");
import { createRoot } from "react-dom/client";
console.log("main.tsx: react-dom/client imported successfully");

console.log("main.tsx: Starting import of App");
import App from "./App";
console.log("main.tsx: App imported successfully");

console.log("main.tsx: Starting import of index.css");
import "./index.css";
console.log("main.tsx: index.css imported successfully");

console.log("main.tsx: Starting createRoot");
const rootElement = document.getElementById("root");
console.log("main.tsx: Root element found:", rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log("main.tsx: Root created successfully");
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log("main.tsx: App rendered successfully");
} else {
  console.error("main.tsx: Root element not found!");
}