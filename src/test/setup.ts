import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { beforeEach } from 'vitest';

beforeEach(() => {
  cleanup();
  localStorage.clear();
  // Reset URL hash so app always starts on the default tab
  window.history.replaceState(null, '', '/');
});
