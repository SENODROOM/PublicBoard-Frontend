import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import api from '../api';

// ── Mocks ─────────────────────────────────────────────────
// AdvancedSearch imports the default api export directly, not named exports
jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

// Prompt is used by saveSearch — mock it globally
global.prompt = jest.fn();

import AdvancedSearch from '../pages/AdvancedSearch';

// ── Helpers ───────────────────────────────────────────────
const mockIssues = [
  {
    _id: 'i1',
    title: 'Broken Streetlight',
    category: 'Infrastructure',
    status: 'Open',
    priority: 'High',
    location: 'Oak Ave',
    supportCount: 10,
    comments: [],
    tags: ['lighting'],
    neighborhood: 'Riverside',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'i2',
    title: 'Pothole on Main St',
    category: 'Infrastructure',
    status: 'Resolved',
    priority: 'Medium',
    location: 'Main St',
    supportCount: 4,
    comments: [{ _id: 'c1' }],
    tags: ['road'],
    neighborhood: 'Downtown',
    createdAt: new Date().toISOString(),
  },
];

// stats response — used by the component on mount to populate neighborhood dropdown
const mockStats = {
  neighborhoods: [{ _id: 'Riverside' }, { _id: 'Downtown' }],
};

function renderSearch(initialUrl = '/search') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <AdvancedSearch />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  // Default: stats call returns neighborhoods; issues call returns results
  api.get.mockImplementation((url) => {
    if (url.includes('/issues/stats')) return Promise.resolve({ data: mockStats });
    if (url.includes('/issues')) return Promise.resolve({ data: { issues: mockIssues, total: 2, pages: 1 } });
    return Promise.resolve({ data: {} });
  });
});

// ── Initial render ────────────────────────────────────────
describe('AdvancedSearch — initial render', () => {
  test('renders heading and subtitle', () => {
    renderSearch();
    expect(screen.getByRole('heading', { name: /advanced search/i })).toBeInTheDocument();
    expect(screen.getByText(/search and filter all community issues/i)).toBeInTheDocument();
  });

  test('renders the keywords search input', () => {
    renderSearch();
    expect(
      screen.getByPlaceholderText(/search titles, descriptions, locations/i)
    ).toBeInTheDocument();
  });

  test('renders all category radio options', () => {
    renderSearch();
    const categories = [
      'Infrastructure', 'Safety', 'Sanitation',
      'Community Resources', 'Environment', 'Transportation', 'Other',
    ];
    categories.forEach((cat) => {
      expect(screen.getByLabelText(cat)).toBeInTheDocument();
    });
  });

  test('renders all status filter buttons', () => {
    renderSearch();
    ['Open', 'In Progress', 'Pending Review', 'Resolved'].forEach((status) => {
      expect(screen.getByRole('button', { name: status })).toBeInTheDocument();
    });
  });

  test('renders all priority filter buttons', () => {
    renderSearch();
    ['Critical', 'High', 'Medium', 'Low'].forEach((priority) => {
      expect(screen.getByRole('button', { name: priority })).toBeInTheDocument();
    });
  });

  test('renders the Sort By dropdown', () => {
    renderSearch();
    expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
  });

  test('renders the Search button', () => {
    renderSearch();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  test('shows the pre-search prompt illustration when nothing has been searched yet', () => {
    renderSearch();
    expect(
      screen.getByText(/use the filters on the left to search issues/i)
    ).toBeInTheDocument();
  });

  test('does not show results area before first search', () => {
    renderSearch();
    expect(screen.queryByText(/results found/i)).not.toBeInTheDocument();
  });
});

// ── Stats fetch on mount ──────────────────────────────────
describe('AdvancedSearch — neighborhoods from stats', () => {
  test('fetches stats to populate neighborhood dropdown', async () => {
    renderSearch();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/issues/stats'));
    });
  });

  test('renders neighborhood dropdown when stats returns neighborhoods', async () => {
    renderSearch();

    await waitFor(() => {
      expect(screen.getByLabelText(/neighborhood/i)).toBeInTheDocument();
      expect(screen.getByText('Riverside')).toBeInTheDocument();
      expect(screen.getByText('Downtown')).toBeInTheDocument();
    });
  });
});

// ── Performing a search ───────────────────────────────────
describe('AdvancedSearch — performing a search', () => {
  test('clicking Search calls the issues API', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/issues'));
    });
  });

  test('displays result count after search', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/2 results found/i)).toBeInTheDocument();
    });
  });

  test('renders an issue row for each result', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Broken Streetlight')).toBeInTheDocument();
      expect(screen.getByText('Pothole on Main St')).toBeInTheDocument();
    });
  });

  test('pressing Enter in the keywords input triggers a search', async () => {
    const user = userEvent.setup();
    renderSearch();

    const input = screen.getByPlaceholderText(/search titles, descriptions, locations/i);
    await user.type(input, 'pothole{Enter}');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('pothole'));
    });
  });

  test('shows Searching… on the button while loading', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/issues/stats')) return Promise.resolve({ data: mockStats });
      return new Promise(() => {}); // issues call never resolves
    });
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(screen.getByRole('button', { name: /searching/i })).toBeInTheDocument();
  });

  test('search button is disabled while loading', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/issues/stats')) return Promise.resolve({ data: mockStats });
      return new Promise(() => {});
    });
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();
  });
});

// ── Empty results ─────────────────────────────────────────
describe('AdvancedSearch — no results', () => {
  test('shows no-results message when API returns empty array', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/issues/stats')) return Promise.resolve({ data: mockStats });
      return Promise.resolve({ data: { issues: [], total: 0, pages: 0 } });
    });
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/no issues match your search/i)).toBeInTheDocument();
    });
  });

  test('shows hint to broaden keywords in empty state', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/issues/stats')) return Promise.resolve({ data: mockStats });
      return Promise.resolve({ data: { issues: [], total: 0, pages: 0 } });
    });
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/try removing some filters/i)).toBeInTheDocument();
    });
  });
});

// ── Filter interactions ───────────────────────────────────
describe('AdvancedSearch — filter interactions', () => {
  test('selecting a category radio updates the filter', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByLabelText('Infrastructure'));

    expect(screen.getByLabelText('Infrastructure')).toBeChecked();
  });

  test('clicking a status button toggles it on', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: 'Open' }));

    // Clicking Search now should include status=Open in the query
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('status=Open'));
    });
  });

  test('clicking the same status button twice de-selects it', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Open' })); // toggle off

    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() => {
      // status should NOT be in the query string
      const calls = api.get.mock.calls.filter((c) => c[0].includes('/issues?'));
      expect(calls[calls.length - 1][0]).not.toContain('status=Open');
    });
  });

  test('clicking a priority button includes it in the search query', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: 'High' }));
    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('priority=High'));
    });
  });

  test('typing in the Tags input includes tags in the search query', async () => {
    const user = userEvent.setup();
    renderSearch();

    const tagsInput = screen.getByPlaceholderText(/e.g. pothole, flooding/i);
    await user.type(tagsInput, 'lighting,safety');

    await user.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('tags=lighting'));
    });
  });

  test('Clear All Filters button resets all filters', async () => {
    const user = userEvent.setup();
    renderSearch();

    // Apply a filter to make the Clear button appear
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const clearButton = await screen.findByRole('button', { name: /clear all filters/i });
    await user.click(clearButton);

    // Status button should no longer be visually selected (clear button gone = filters reset)
    expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();
  });
});

// ── Save Search ───────────────────────────────────────────
describe('AdvancedSearch — save search', () => {
  test('Save Search button appears after getting results', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save search/i })).toBeInTheDocument();
    });
  });

  test('prompts for a name when Save Search is clicked', async () => {
    global.prompt.mockReturnValue('My test search');
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByRole('button', { name: /save search/i }));
    await user.click(screen.getByRole('button', { name: /save search/i }));

    expect(global.prompt).toHaveBeenCalled();
  });

  test('saved search appears in the Saved Searches panel', async () => {
    global.prompt.mockReturnValue('Pothole searches');
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByRole('button', { name: /save search/i }));
    await user.click(screen.getByRole('button', { name: /save search/i }));

    expect(screen.getByText('Saved Searches')).toBeInTheDocument();
    expect(screen.getByText('Pothole searches')).toBeInTheDocument();
  });

  test('does not save when prompt is cancelled (returns null)', async () => {
    global.prompt.mockReturnValue(null);
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByRole('button', { name: /save search/i }));
    await user.click(screen.getByRole('button', { name: /save search/i }));

    expect(screen.queryByText('Saved Searches')).not.toBeInTheDocument();
  });

  test('×  button deletes a saved search', async () => {
    global.prompt.mockReturnValue('Search to delete');
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByRole('button', { name: /save search/i }));
    await user.click(screen.getByRole('button', { name: /save search/i }));

    await screen.findByText('Search to delete');
    const deleteBtn = screen.getByRole('button', { name: '×' });
    await user.click(deleteBtn);

    expect(screen.queryByText('Search to delete')).not.toBeInTheDocument();
  });
});

// ── URL-driven auto-search ────────────────────────────────
describe('AdvancedSearch — URL param auto-search', () => {
  test('auto-searches when URL has a q param', async () => {
    renderSearch('/search?q=pothole');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('pothole'));
    });
  });

  test('populates the keyword input from URL q param', async () => {
    renderSearch('/search?q=flooding');

    const input = screen.getByPlaceholderText(/search titles, descriptions, locations/i);
    expect(input).toHaveValue('flooding');
  });

  test('auto-searches when URL has a status param', async () => {
    renderSearch('/search?status=Resolved');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('status=Resolved'));
    });
  });
});

// ── Issue row content ─────────────────────────────────────
describe('AdvancedSearch — issue row content', () => {
  async function searchAndGetResults() {
    const user = userEvent.setup();
    renderSearch();
    await user.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByText('Broken Streetlight'));
  }

  test('issue title links to the issue detail page', async () => {
    await searchAndGetResults();

    const link = screen.getByRole('link', { name: 'Broken Streetlight' });
    expect(link).toHaveAttribute('href', '/issues/i1');
  });

  test('renders issue category in each row', async () => {
    await searchAndGetResults();
    expect(screen.getAllByText('Infrastructure').length).toBeGreaterThanOrEqual(1);
  });

  test('renders issue status in each row', async () => {
    await searchAndGetResults();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  test('renders support count in each row', async () => {
    await searchAndGetResults();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});