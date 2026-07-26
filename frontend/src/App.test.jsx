import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import App from './App';

test('renders Command Center', () => {
  render(<App />);
  const titleElement = screen.getByText(/Command Center/i);
  expect(titleElement).toBeTruthy();
});
