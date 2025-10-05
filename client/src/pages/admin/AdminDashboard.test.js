// AdminDashboard.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

// NOTE: adjust these relative paths if your test file is placed elsewhere.
// These paths assume the test file is in the same folder as AdminDashboard.js
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="mock-layout">{children}</div>;
  };
});

jest.mock('../../components/AdminMenu', () => {
  return function MockAdminMenu() {
    return <div data-testid="mock-adminmenu">Mock Admin Menu</div>;
  };
});

import { useAuth } from '../../context/auth';
import AdminDashboard from './AdminDashboard'; // adjust if test file isn't next to AdminDashboard

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin labels and user info when auth has a user', () => {
    useAuth.mockReturnValue([
        { user: { name: 'Alice Admin', email: 'alice@example.com', phone: '12345678' } },
        jest.fn(),
    ]);

    render(<AdminDashboard />);

    // Labels
    expect(screen.getByText(/Admin Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Contact/i)).toBeInTheDocument();

    // Values (using robust contains checks)
    expect(screen.getByText(/Admin Name/i)).toHaveTextContent(/Alice Admin/);
    expect(screen.getByText(/Admin Email/i)).toHaveTextContent(/alice@example.com/);
    expect(screen.getByText(/Admin Contact/i)).toHaveTextContent(/12345678/);

    // Mocks mounted
    expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
    expect(screen.getByTestId('mock-adminmenu')).toBeInTheDocument();
  });


  it('renders labels but no user values when auth is null', () => {
    useAuth.mockReturnValue([null, jest.fn()]);

    render(<AdminDashboard />);

    // Labels still render
    expect(screen.getByText(/Admin Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Contact/i)).toBeInTheDocument();

    // But no values
    expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('12345678')).not.toBeInTheDocument();
  });
});
