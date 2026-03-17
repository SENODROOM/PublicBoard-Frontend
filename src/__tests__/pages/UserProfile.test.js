import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { issuesAPI, authAPI } from '../api';
import toast from 'react-hot-toast';

// ── Mocks ────────────────────────────────────────────────
jest.mock('../api');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));
jest.mock('../components/IssueCard', () => ({ issue }) => (
  <div data-testid="issue-card">{issue.title}</div>
));

// AuthContext mock — we control user per-test via mockReturnValue
const mockUpdateProfile = jest.fn();
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
const { useAuth } = require('../context/AuthContext');

import UserProfile from '../pages/UserProfile';

// ── Helpers ───────────────────────────────────────────────
const baseUser = {
  id: 'u1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  role: 'user',
  bio: 'Community activist',
  neighborhood: 'Riverside',
  reputation: 120,
  badges: [],
  stats: {
    issuesReportedCount: 3,
    issuesResolvedCount: 1,
    totalSupportGiven: 7,
    commentsCount: 5,
  },
};

function renderProfile(user = baseUser) {
  useAuth.mockReturnValue({ user, updateProfile: mockUpdateProfile });
  return render(
    <BrowserRouter>
      <UserProfile />
    </BrowserRouter>
  );
}

const mockIssues = [
  { _id: 'i1', title: 'Broken Streetlight', category: 'Infrastructure', status: 'Open',     reporter: { userId: 'u1' }, createdAt: new Date().toISOString() },
  { _id: 'i2', title: 'Pothole on Oak Ave', category: 'Infrastructure', status: 'Resolved', reporter: { userId: 'u1' }, createdAt: new Date().toISOString() },
  { _id: 'i3', title: 'Other User Issue',   category: 'Safety',         status: 'Open',     reporter: { userId: 'u99' }, createdAt: new Date().toISOString() },
];

beforeEach(() => {
  jest.clearAllMocks();
  issuesAPI.getAll.mockResolvedValue({ data: { issues: mockIssues } });
});

// ── Rendering ─────────────────────────────────────────────
describe('UserProfile — header', () => {
  test('renders the user name as a heading', async () => {
    renderProfile();
    expect(screen.getByRole('heading', { name: 'Alice Smith' })).toBeInTheDocument();
  });

  test('renders avatar initial from first letter of name', () => {
    renderProfile();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  test('renders bio when present', async () => {
    renderProfile();
    expect(screen.getByText('Community activist')).toBeInTheDocument();
  });

  test('does not render bio section when bio is empty', () => {
    renderProfile({ ...baseUser, bio: '' });
    expect(screen.queryByText('Community activist')).not.toBeInTheDocument();
  });

  test('renders neighborhood when present', () => {
    renderProfile();
    expect(screen.getByText(/riverside/i)).toBeInTheDocument();
  });

  test('renders reputation score', () => {
    renderProfile();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText(/reputation/i)).toBeInTheDocument();
  });

  test('renders computed level based on reputation', () => {
    // repLevel = Math.floor(120 / 50) + 1 = 3
    renderProfile();
    expect(screen.getByText(/level 3/i)).toBeInTheDocument();
  });

  test('shows ADMIN badge when user role is admin', () => {
    renderProfile({ ...baseUser, role: 'admin' });
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  test('does not show ADMIN badge for regular user', () => {
    renderProfile();
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
  });

  test('renders nothing when no user is logged in', () => {
    useAuth.mockReturnValue({ user: null, updateProfile: mockUpdateProfile });
    const { container } = render(
      <BrowserRouter><UserProfile /></BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });
});

// ── Stats row ─────────────────────────────────────────────
describe('UserProfile — stats row', () => {
  test('renders all four stat labels', () => {
    renderProfile();
    expect(screen.getByText('Reported')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('Supported')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  test('displays correct stat values from user.stats', () => {
    renderProfile();
    // issuesReportedCount = 3, issuesResolvedCount = 1, totalSupportGiven = 7, commentsCount = 5
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

// ── Badges ────────────────────────────────────────────────
describe('UserProfile — badges', () => {
  test('renders badge labels when user has badges', () => {
    renderProfile({
      ...baseUser,
      badges: [
        { id: 'first_report', label: 'First Report', icon: '📋' },
        { id: 'donor', label: 'Donor', icon: '💚' },
      ],
    });
    expect(screen.getByText(/first report/i)).toBeInTheDocument();
    expect(screen.getByText(/donor/i)).toBeInTheDocument();
  });

  test('does not render badges section when user has no badges', () => {
    renderProfile({ ...baseUser, badges: [] });
    expect(screen.queryByText(/badges earned/i)).not.toBeInTheDocument();
  });
});

// ── Tabs ──────────────────────────────────────────────────
describe('UserProfile — tabs', () => {
  test('renders My Issues tab and Change Password tab buttons', () => {
    renderProfile();
    expect(screen.getByRole('button', { name: /my issues/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });

  test('My Issues tab is active by default', () => {
    renderProfile();
    // Issues tab is shown first; password form is not visible
    expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
  });

  test('switching to Change Password tab reveals the password form', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByText('Current Password')).toBeInTheDocument();
    expect(screen.getByText(/new password/i)).toBeInTheDocument();
    expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
  });

  test('switching back to My Issues tab hides the password form', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByRole('button', { name: /change password/i }));
    await user.click(screen.getByRole('button', { name: /my issues/i }));

    expect(screen.queryByText('Current Password')).not.toBeInTheDocument();
  });
});

// ── Issues tab ────────────────────────────────────────────
describe('UserProfile — issues tab', () => {
  test('renders only issues reported by this user', async () => {
    renderProfile();

    await waitFor(() => {
      // Only i1 and i2 have reporter.userId === 'u1'
      const cards = screen.getAllByTestId('issue-card');
      expect(cards).toHaveLength(2);
      expect(cards[0]).toHaveTextContent('Broken Streetlight');
      expect(cards[1]).toHaveTextContent('Pothole on Oak Ave');
    });
  });

  test('shows empty state message when user has no issues', async () => {
    issuesAPI.getAll.mockResolvedValue({ data: { issues: [] } });
    renderProfile();

    await waitFor(() => {
      expect(
        screen.getByText(/you haven't reported any issues yet/i)
      ).toBeInTheDocument();
    });
  });

  test('tab label shows correct issue count', async () => {
    renderProfile();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /my issues \(2\)/i })).toBeInTheDocument();
    });
  });
});

// ── Edit profile ──────────────────────────────────────────
describe('UserProfile — edit profile', () => {
  test('clicking Edit Profile reveals the edit form', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByText('Neighborhood')).toBeInTheDocument();
    expect(screen.getByText(/bio/i)).toBeInTheDocument();
  });

  test('edit form is pre-filled with current user values', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    expect(screen.getByDisplayValue('Alice Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Community activist')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Riverside')).toBeInTheDocument();
  });

  test('Cancel button hides the edit form', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
  });

  test('save calls updateProfile with current form values', async () => {
    const user = userEvent.setup();
    mockUpdateProfile.mockResolvedValue({ ...baseUser, name: 'Alice Updated' });
    renderProfile();

    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    const nameInput = screen.getByDisplayValue('Alice Smith');
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice Updated');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alice Updated' })
      );
    });
  });

  test('shows success toast on successful save', async () => {
    const user = userEvent.setup();
    mockUpdateProfile.mockResolvedValue(baseUser);
    renderProfile();

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Profile updated');
    });
  });

  test('shows error toast when save fails', async () => {
    const user = userEvent.setup();
    mockUpdateProfile.mockRejectedValue({
      response: { data: { message: 'Name too short' } },
    });
    renderProfile();

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Name too short');
    });
  });

  test('disables Save button while saving', async () => {
    const user = userEvent.setup();
    mockUpdateProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );
    renderProfile();

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});

// ── Change password ───────────────────────────────────────
describe('UserProfile — change password tab', () => {
  async function openPasswordTab() {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole('button', { name: /change password/i }));
    return user;
  }

  test('shows error toast when new passwords do not match', async () => {
    const user = await openPasswordTab();

    await user.type(screen.getByLabelText(/current password/i), 'oldpass123');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'different123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(toast.error).toHaveBeenCalledWith('New passwords do not match');
    expect(authAPI.changePassword).not.toHaveBeenCalled();
  });

  test('shows error toast when new password is fewer than 8 chars', async () => {
    const user = await openPasswordTab();

    await user.type(screen.getByLabelText(/current password/i), 'oldpass123');
    await user.type(screen.getByLabelText(/new password/i), 'short');
    await user.type(screen.getByLabelText(/confirm new password/i), 'short');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters');
  });

  test('calls authAPI.changePassword with correct fields on valid submission', async () => {
    const user = await openPasswordTab();
    authAPI.changePassword.mockResolvedValue({ data: { message: 'Password updated successfully' } });

    await user.type(screen.getByLabelText(/current password/i), 'oldpass123');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(authAPI.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
      });
    });
  });

  test('shows success toast after password change', async () => {
    const user = await openPasswordTab();
    authAPI.changePassword.mockResolvedValue({ data: {} });

    await user.type(screen.getByLabelText(/current password/i), 'oldpass123');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Password changed successfully');
    });
  });

  test('clears form fields after successful password change', async () => {
    const user = await openPasswordTab();
    authAPI.changePassword.mockResolvedValue({ data: {} });

    const currentPw = screen.getByLabelText(/current password/i);
    const newPw     = screen.getByLabelText(/new password/i);
    const confirmPw = screen.getByLabelText(/confirm new password/i);

    await user.type(currentPw, 'oldpass123');
    await user.type(newPw, 'newpass123');
    await user.type(confirmPw, 'newpass123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(currentPw).toHaveValue('');
      expect(newPw).toHaveValue('');
      expect(confirmPw).toHaveValue('');
    });
  });

  test('shows error toast when API call fails', async () => {
    const user = await openPasswordTab();
    authAPI.changePassword.mockRejectedValue({
      response: { data: { message: 'Current password is incorrect' } },
    });

    await user.type(screen.getByLabelText(/current password/i), 'wrongpass');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Current password is incorrect');
    });
  });

  test('disables Update Password button while submitting', async () => {
    const user = await openPasswordTab();
    authAPI.changePassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    await user.type(screen.getByLabelText(/current password/i), 'oldpass123');
    await user.type(screen.getByLabelText(/new password/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
  });
});