import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import api from '../api';

// ── Mocks ─────────────────────────────────────────────────
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get:  jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
const { useAuth } = require('../context/AuthContext');

import Bookmarks from '../pages/Bookmarks';

// ── Helpers ───────────────────────────────────────────────
const loggedInUser = { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'user' };

const mockIssues = [
  {
    _id: 'b1',
    title: 'Broken Streetlight',
    category: 'Infrastructure',
    status: 'Open',
    location: 'Oak Ave',
    supportCount: 12,
    comments: [{ _id: 'c1' }, { _id: 'c2' }],
    tags: ['lighting', 'safety'],
  },
  {
    _id: 'b2',
    title: 'Pothole on Main St',
    category: 'Infrastructure',
    status: 'Resolved',
    location: 'Main St',
    supportCount: 5,
    comments: [],
    tags: ['road'],
  },
];

function renderBookmarks(user = loggedInUser) {
  useAuth.mockReturnValue({ user });
  return render(
    <BrowserRouter>
      <Bookmarks />
    </BrowserRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockResolvedValue({ data: { issues: mockIssues } });
  api.post.mockResolvedValue({ data: {} });
});

// ── Unauthenticated state ─────────────────────────────────
describe('Bookmarks — unauthenticated', () => {
  test('shows sign-in prompt when user is null', () => {
    renderBookmarks(null);

    expect(screen.getByText(/sign in to view bookmarks/i)).toBeInTheDocument();
  });

  test('shows a link to the login page', () => {
    renderBookmarks(null);

    const link = screen.getByRole('link', { name: /go to login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  test('does not call the API when user is null', () => {
    renderBookmarks(null);

    expect(api.get).not.toHaveBeenCalled();
  });
});

// ── Authenticated — loading ───────────────────────────────
describe('Bookmarks — loading state', () => {
  test('shows loading indicator while fetch is in progress', () => {
    // Never resolves during this test
    api.get.mockReturnValue(new Promise(() => {}));
    renderBookmarks();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

// ── Authenticated — with bookmarks ────────────────────────
describe('Bookmarks — with bookmarks', () => {
  test('renders the page heading', async () => {
    renderBookmarks();
    await waitFor(() => expect(screen.getByRole('heading', { name: /bookmarks/i })).toBeInTheDocument());
  });

  test('renders a card for each bookmarked issue', async () => {
    renderBookmarks();

    await waitFor(() => {
      expect(screen.getByText('Broken Streetlight')).toBeInTheDocument();
      expect(screen.getByText('Pothole on Main St')).toBeInTheDocument();
    });
  });

  test('fetches bookmarks from the correct endpoint', async () => {
    renderBookmarks();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/users/me/bookmarks');
    });
  });

  test('renders issue status badge for each issue', async () => {
    renderBookmarks();

    await waitFor(() => {
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
    });
  });

  test('renders issue category for each issue', async () => {
    renderBookmarks();

    await waitFor(() => {
      const categoryBadges = screen.getAllByText('Infrastructure');
      expect(categoryBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('renders tags for each issue', async () => {
    renderBookmarks();

    await waitFor(() => {
      expect(screen.getByText('#lighting')).toBeInTheDocument();
      expect(screen.getByText('#safety')).toBeInTheDocument();
      expect(screen.getByText('#road')).toBeInTheDocument();
    });
  });

  test('renders location, support count, and comment count', async () => {
    renderBookmarks();

    await waitFor(() => {
      expect(screen.getByText(/oak ave/i)).toBeInTheDocument();
      expect(screen.getByText(/12/)).toBeInTheDocument(); // supportCount
      expect(screen.getByText(/2/)).toBeInTheDocument();  // comments.length
    });
  });

  test('issue title is a link to the issue detail page', async () => {
    renderBookmarks();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Broken Streetlight' });
      expect(link).toHaveAttribute('href', '/issues/b1');
    });
  });

  test('renders a Remove button for each issue', async () => {
    renderBookmarks();

    await waitFor(() => {
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons).toHaveLength(2);
    });
  });
});

// ── Authenticated — remove bookmark ──────────────────────
describe('Bookmarks — removing a bookmark', () => {
  test('calls the toggle endpoint when Remove is clicked', async () => {
    const user = userEvent.setup();
    renderBookmarks();

    await waitFor(() => screen.getAllByRole('button', { name: /remove/i }));
    const [firstRemove] = screen.getAllByRole('button', { name: /remove/i });
    await user.click(firstRemove);

    expect(api.post).toHaveBeenCalledWith('/issues/b1/bookmark');
  });

  test('removes the issue from the list after clicking Remove', async () => {
    const user = userEvent.setup();
    renderBookmarks();

    await waitFor(() => screen.getAllByRole('button', { name: /remove/i }));
    const [firstRemove] = screen.getAllByRole('button', { name: /remove/i });
    await user.click(firstRemove);

    await waitFor(() => {
      expect(screen.queryByText('Broken Streetlight')).not.toBeInTheDocument();
      // Second bookmark should still be there
      expect(screen.getByText('Pothole on Main St')).toBeInTheDocument();
    });
  });

  test('removing the last bookmark shows the empty state', async () => {
    api.get.mockResolvedValue({ data: { issues: [mockIssues[0]] } });
    const user = userEvent.setup();
    renderBookmarks();

    await waitFor(() => screen.getByRole('button', { name: /remove/i }));
    await user.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => {
      expect(screen.getByText(/no bookmarks yet/i)).toBeInTheDocument();
    });
  });
});

// ── Authenticated — empty state ───────────────────────────
describe('Bookmarks — empty state', () => {
  test('shows empty state when user has no bookmarks', async () => {
    api.get.mockResolvedValue({ data: { issues: [] } });
    renderBookmarks();

    await waitFor(() => {
      expect(screen.getByText(/no bookmarks yet/i)).toBeInTheDocument();
      expect(screen.getByText(/save issues to come back to them later/i)).toBeInTheDocument();
    });
  });

  test('shows Browse Issues link in empty state', async () => {
    api.get.mockResolvedValue({ data: { issues: [] } });
    renderBookmarks();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /browse issues/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/');
    });
  });
});