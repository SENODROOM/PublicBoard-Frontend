import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import NotificationPanel from '../components/NotificationPanel';

const mockNotifications = [
  {
    _id: '1',
    type: 'issue.supported',
    title: 'Your issue received support',
    message: 'Someone supported your issue',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    _id: '2',
    type: 'issue.commented',
    title: 'New comment on your issue',
    message: 'Admin commented on your issue',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('NotificationPanel', () => {
  const mockOnClose = jest.fn();
  const mockOnMarkRead = jest.fn();
  const mockOnMarkAllRead = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders notification panel with header', () => {
    renderWithProviders(
      <NotificationPanel
        notifications={mockNotifications}
        unreadCount={1}
        onMarkRead={mockOnMarkRead}
        onMarkAllRead={mockOnMarkAllRead}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('1 unread')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close notifications' })).toBeInTheDocument();
  });

  test('renders empty state when no notifications', () => {
    renderWithProviders(
      <NotificationPanel
        notifications={[]}
        unreadCount={0}
        onMarkRead={mockOnMarkRead}
        onMarkAllRead={mockOnMarkAllRead}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  test('renders notification items correctly', () => {
    renderWithProviders(
      <NotificationPanel
        notifications={mockNotifications}
        unreadCount={1}
        onMarkRead={mockOnMarkRead}
        onMarkAllRead={mockOnMarkAllRead}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Your issue received support')).toBeInTheDocument();
    expect(screen.getByText('New comment on your issue')).toBeInTheDocument();
    expect(screen.getByText('5m ago')).toBeInTheDocument();
    expect(screen.getByText('1h ago')).toBeInTheDocument();
  });

  test('calls onMarkRead when unread notification is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <NotificationPanel
        notifications={mockNotifications}
        unreadCount={1}
        onMarkRead={mockOnMarkRead}
        onMarkAllRead={mockOnMarkAllRead}
        onClose={mockOnClose}
      />
    );

    const unreadNotification = screen.getByText('Your issue received support');
    await user.click(unreadNotification);

    expect(mockOnMarkRead).toHaveBeenCalledWith('1');
  });

  test('calls onMarkAllRead when Mark all read is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <NotificationPanel
        notifications={mockNotifications}
        unreadCount={1}
        onMarkRead={mockOnMarkRead}
        onMarkAllRead={mockOnMarkAllRead}
        onClose={mockOnClose}
      />
    );

    const markAllReadButton = screen.getByText('Mark all read');
    await user.click(markAllReadButton);

    expect(mockOnMarkAllRead).toHaveBeenCalled();
  });

  test('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <NotificationPanel
        notifications={mockNotifications}
        unreadCount={1}
        onMarkRead={mockOnMarkRead}
        onMarkAllRead={mockOnMarkAllRead}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Close notifications' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows unread indicator for unread notifications', () => {
    renderWithProviders(
      <NotificationPanel
        notifications={mockNotifications}
        unreadCount={1}
        onMarkRead={mockOnMarkRead}
        onMarkAllRead={mockOnMarkAllRead}
        onClose={mockOnClose}
      />
    );

    const unreadIndicator = screen.getByLabelText('Unread');
    expect(unreadIndicator).toBeInTheDocument();
  });
});
