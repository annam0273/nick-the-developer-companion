import React from 'react';
import { createRoot } from 'react-dom/client';
import mountCompanion from './mount-companion';

console.log('Mochi Developer Companion: Content script injected.');

// Ensure we don't inject multiple times
if (!document.getElementById('focus-companion-root')) {
  mountCompanion();
}
