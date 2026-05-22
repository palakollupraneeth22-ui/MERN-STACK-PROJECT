import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found! Cannot mount React app.");
  document.body.innerHTML = "<h1>Error: Root element not found</h1>";
} else {
  try {
    console.log("Initializing React app...");
    
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Remove loading screen once React is mounted
    setTimeout(() => {
      const loadingScreen = rootElement.querySelector(".app-loading");
      if (loadingScreen) {
        loadingScreen.style.display = "none";
      }
    }, 100);
    
    console.log("React app mounted successfully");
  } catch (error) {
    console.error("Error mounting React app:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: #ff6b6b; font-family: monospace; background: #121212; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h2>⚠️ Failed to load application</h2>
      <p style="margin: 10px 0;">${error.message}</p>
      <p style="font-size: 12px; color: #a0a0a0;">Check the browser console for more details.</p>
      <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #bb86fc; color: #121212; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Reload Page</button>
    </div>`;
  }
}