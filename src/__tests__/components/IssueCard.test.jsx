import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import IssueCard from '../../components/IssueCard';

const BASE_ISSUE = {
  _id: 'issue-1',
  title: 'Broken streetlight on Oak Ave',
  category: 'Infrastructure',
  priority: 'High',
  status: 'Open',
  location: 'Oak Ave & 5th St',
  neighborhood: 'Riverside',
  tags: ['streetlight', 'safety'],
  supportCount: 24,
  views: 142,
  comments: Array(7).fill({}),
  createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
};

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <IssueCard issue={BASE_ISSUE} {...props} />
    </MemoryRouter>
  );
}

describe('IssueCard — rendering', () => {
  it('renders the issue title', () => {
    renderCard();
    expect(screen.getByText('Broken streetlight on Oak Ave')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    renderCard();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders priority badge', () => {
    renderCard();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    renderCard();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
  });

  it('renders location', () => {
    renderCard();
    expect(screen.getByText(/Oak Ave & 5th St/i)).toBeInTheDocument();
  });

  it('renders support count', () => {
    renderCard();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('renders tags', () => {
    renderCard();
    expect(screen.getByText(/#streetlight/i)).toBeInTheDocument();
    expect(screen.getByText(/#safety/i)).toBeInTheDocument();
  });

  it('renders view and comment count in footer', () => {
    renderCard();
    expect(screen.getByText(/142/)).toBeInTheDocument();
    expect(screen.getByText(/7/)).toBeInTheDocument();
  });

  it('title links to the issue detail page', () => {
    renderCard();
    const link = screen.getByRole('link', { name: /broken streetlight/i });
    expect(link).toHaveAttribute('href', '/issues/issue-1');
  });
});

describe('IssueCard — accessibility', () => {
  it('vote button has descriptive aria-label', () => {
    renderCard({ onSupport: jest.fn() });
    const btn = screen.getByRole('button', { name: /support this issue/i });
    expect(btn).toBeInTheDocument();
  });

  it('vote button has aria-pressed="false" when not supported', () => {
    renderCard({ onSupport: jest.fn(), hasSupported: false });
    const btn = screen.getByRole('button', { name: /support this issue/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('vote button has aria-pressed="true" when supported', () => {
    renderCard({ onSupport: jest.fn(), hasSupported: true });
    const btn = screen.getByRole('button', { name: /support this issue/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('IssueCard — interactions', () => {
  it('calls onSupport with issue id when vote button clicked', async () => {
    const onSupport = jest.fn();
    renderCard({ onSupport });
    await userEvent.click(screen.getByRole('button', { name: /support this issue/i }));
    expect(onSupport).toHaveBeenCalledWith('issue-1');
  });

  it('does not crash when onSupport is not provided', async () => {
    renderCard(); // no onSupport prop
    // Clicking the button should not throw
    const btn = screen.getByRole('button', { name: /support this issue/i });
    expect(() => fireEvent.click(btn)).not.toThrow();
  });
});

describe('IssueCard — compact mode', () => {
  it('does not render tags in compact mode', () => {
    renderCard({ compact: true });
    expect(screen.queryByText(/#streetlight/i)).not.toBeInTheDocument();
  });

  it('does not render footer row in compact mode', () => {
    renderCard({ compact: true });
    // Views count is in footer — should be absent
    expect(screen.queryByText(/142/)).not.toBeInTheDocument();
  });
});
