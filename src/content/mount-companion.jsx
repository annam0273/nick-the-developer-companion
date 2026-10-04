import React from 'react';
import { createRoot } from 'react-dom/client';
import FoxCorner from './fox/FoxCorner/FoxCorner';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Companion Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{pointerEvents: 'auto', background: 'red', color: 'white', padding: '10px'}}>Something went wrong: {this.state.error?.message}</div>;
    }
    return this.props.children; 
  }
}

export default function mountCompanion() {
  console.log("Mounting companion...");
  const container = document.createElement('div');
  container.id = 'focus-companion-root';
  // Use fixed positioning so the React root itself is out of document flow
  container.style.position = 'fixed';
  container.style.bottom = '0';
  container.style.right = '0';
  container.style.zIndex = '999999';
  container.style.pointerEvents = 'none'; // So the root container doesn't block clicks; we'll enable pointerEvents on the character itself
  document.documentElement.appendChild(container);

  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <FoxCorner />
    </ErrorBoundary>
  );
  console.log("Companion mounted!");
}
