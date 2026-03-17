import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NotificationPanel from '../../components/NotificationPanel';

const NOTIFS = [
  {
    _id: '1',
    type: 'issue.status_changed',
    title: 'Issue resolved',
    message: 'Your issue was marked Resolved',
    isRead: false,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    link: '/issues/abc',
  },
  {
    _id: '2',
    type: 'issue.commented',
    title: 'New comment',
    message: 'Someone commented on your issue',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    link: '',
  },
];

function renderPanel(props = {}) {
  const defaults = {
    notifications: NOTIFS,
    unreadCount: 1,
    onMarkRead: jest.fn(),
    onMarkAllRead: jest.fn(),
    onClose: jest.fn(),
  };
  return render(
    <MemoryRouter>
      <NotificationPanel {...defaults} {...props} />
    </MemoryRouter>
  );
}

describe('NotificationPanel — rendering', () => {
  it('renders notification titles', () => {
    renderPanel();
    expect(screen.getByText('Issue resolved')).toBeInTheDocument();
    expect(screen.getByText('New comment')).toBeInTheDocument();
  });

  it('shows unread count when > 0', () => {
    renderPanel();
    expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    renderPanel({ notifications: [], unreadCount: 0 });
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
  });

  it('hides "mark all read" button when unreadCount is 0', () => {
    renderPanel({ unreadCount: 0 });
    expect(screen.queryByRole('button', { name: /mark all read/i })).not.toBeInTheDocument();
  });
});

describe('NotificationPanel — ARIA', () => {
  it('has role="dialog" and aria-modal="true"', () => {
    renderPanel();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-label on the dialog', () => {
    renderPanel();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Notifications');
  });

  it('close button has a descriptive aria-label', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /close notifications/i })).toBeInTheDocument();
  });

  it('"mark all read" button has descriptive aria-label', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /mark all notifications as read/i })).toBeInTheDocument();
  });
});

describe('NotificationPanel — interactions', () => {
  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    renderPanel({ onClose });
    await userEvent.click(screen.getByRole('button', { name: /close notifications/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    renderPanel({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onMarkRead when an unread notification is clicked', async () => {
    const onMarkRead = jest.fn();
    renderPanel({ onMarkRead });
    // First notification is unread
    const unread = screen.getByText('Issue resolved').closest('[role="listitem"]');
    await userEvent.click(unread);
    expect(onMarkRead).toHaveBeenCalledWith('1');
  });

  it('does NOT call onMarkRead when an already-read notification is clicked', async () => {
    const onMarkRead = jest.fn();
    renderPanel({ onMarkRead });
    const readItem = screen.getByText('New comment').closest('[role="listitem"]');
    await userEvent.click(readItem);
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it('calls onMarkAllRead when the button is clicked', async () => {
    const onMarkAllRead = jest.fn();
    renderPanel({ onMarkAllRead });
    await userEvent.click(screen.getByRole('button', { name: /mark all notifications as read/i }));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('focuses the close button on mount', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /close notifications/i })).toHaveFocus();
  });
});
