
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logError } from './lib/env.ts'

// Create a container for the root element
const container = document.getElementById("root");

// Check if the root element exists
if (!container) {
  logError(new Error("Root element not found"), "Application Initialization");
  const errorDiv = document.createElement("div");
  errorDiv.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
      <h1 style="color: red;">Error: Root Element Not Found</h1>
      <p>The application could not be initialized because the root element is missing.</p>
    </div>
  `;
  document.body.appendChild(errorDiv);
} else {
  // Initialize the app
  try {
    const root = createRoot(container);
    root.render(<App />);
    console.log("Application successfully initialized");
  } catch (error) {
    logError(error, "Application Rendering");
    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
        <h1 style="color: red;">Application Error</h1>
        <p>Sorry, an error occurred while initializing the application.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; max-width: 80%; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }
}
