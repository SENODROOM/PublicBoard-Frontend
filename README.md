# PublicBoard — Frontend

> React 18 SPA for the PublicBoard community issue tracking platform.

---

## 🚀 Quick Start

```bash
cd client
npm install
npm start
# App runs on http://localhost:3000
# Proxies API calls to http://localhost:5000
```

---

## 📁 Project Structure

```
client/
├── package.json
├── public/
│   └── index.html
└── src/
    ├── App.js                        # Router + Toaster + route guards
    ├── index.js                      # React DOM entry
    ├── index.css                     # Global design system + responsive
    ├── api.js                        # Axios instance + all API methods
    ├── context/
    │   └── AuthContext.js            # Auth state, login/register/logout
    ├── components/
    │   ├── Navbar.js                 # Responsive sticky nav + mobile menu
    │   └── IssueCard.js             # Reusable issue card component
    └── pages/
        ├── Home.js                   # Landing page
        ├── Dashboard.js              # Issue list with filters
        ├── ReportIssue.js           # Issue submission form
        ├── IssueDetail.js           # Single issue + update timeline
        ├── Donate.js                # Donation platform
        ├── Login.js                 # Login form
        ├── Register.js              # Registration form
        └── admin/
            ├── AdminLayout.js        # Sidebar layout + mobile nav
            ├── AdminOverview.js      # Dashboard stats + charts
            ├── AdminIssues.js        # Issue CRUD + bulk actions
            ├── AdminUsers.js         # User management + role control
            └── AdminDonations.js     # Donation records
```

---

## 🎨 Design System

PublicBoard uses a custom **brutalist/editorial** design aesthetic:

### Fonts
- **Display:** `Syne` (800 weight) — headings, numbers, labels
- **Body/Code:** `Space Mono` — navigation, tags, forms, metadata

### Color Palette
```css
--ink:    #0a0a0f   /* Near-black — primary text, borders, buttons */
--paper:  #f5f0e8   /* Warm off-white — page background */
--cement: #c8c2b4   /* Muted beige — secondary text */
--amber:  #e8a020   /* Gold — accents, CTA, highlights */
--green:  #2a7a4a   /* Forest green — resolved, donations, success */
--red:    #c83232   /* Brick red — open issues, errors, alerts */
--blue:   #1a4a8a   /* Navy — in-progress issues */
--purple: #6a3a9a   /* Plum — pending review, transportation */
```

### Key CSS Variables
```css
--shadow:    4px 4px 0px #0a0a0f   /* Hard offset shadow (brutalist) */
--shadow-lg: 6px 6px 0px #0a0a0f  /* Larger variant */
--radius:    0px                    /* No border radius — intentional */
```

### Components

**Buttons:**
```jsx
<button className="btn">Default</button>
<button className="btn btn-primary">Dark filled</button>
<button className="btn btn-amber">Amber accent</button>
<button className="btn btn-green">Green / success</button>
<button className="btn btn-red">Red / danger</button>
<button className="btn btn-sm">Small</button>
<button className="btn btn-lg">Large</button>
```

**Status Badges:**
```jsx
<span className="badge badge-open">Open</span>
<span className="badge badge-progress">In Progress</span>
<span className="badge badge-pending">Pending Review</span>
<span className="badge badge-resolved">Resolved</span>
```

**Grid Layouts:**
```jsx
<div className="grid-2">...</div>  /* 2 columns */
<div className="grid-3">...</div>  /* 3 columns */
<div className="grid-4">...</div>  /* 4 columns */
/* All collapse to 1 column on mobile */
```

---

## 📡 API Layer (`src/api.js`)

All API calls are organized in named exports:

```javascript
import { issuesAPI, authAPI, donationsAPI, adminAPI } from './api';

// Issues
issuesAPI.getAll({ status: 'Open', category: 'Infrastructure', search: 'road', sort: '-createdAt' })
issuesAPI.getOne(id)
issuesAPI.getStats()
issuesAPI.create({ title, description, category, location, reporter })
issuesAPI.support(id)                            // toggle support (JWT)
issuesAPI.updateStatus(id, { status, message }) // JWT required

// Auth
authAPI.register({ name, email, password })
authAPI.login({ email, password })
authAPI.me()                                    // JWT required

// Donations
donationsAPI.getAll()
donationsAPI.getStats()
donationsAPI.create({ name, email, amount, message, isAnonymous })

// Admin (JWT + admin role required)
adminAPI.getOverview()
adminAPI.getUsers({ search, role, page, limit })
adminAPI.getUser(id)
adminAPI.updateUserRole(id, role)
adminAPI.deleteUser(id)
adminAPI.getIssues({ status, category, search, sort, page, limit })
adminAPI.updateIssue(id, { status, message })
adminAPI.deleteIssue(id)
adminAPI.bulkStatusUpdate(ids, status)
adminAPI.bulkDelete(ids)
adminAPI.getDonations({ status, page, limit })
```

The Axios instance automatically:
1. Sets `baseURL` from `REACT_APP_API_URL` env var (fallback: `http://localhost:5000/api`)
2. Injects `Authorization: Bearer <token>` from `localStorage` on every request

---

## 🔐 Auth Context (`src/context/AuthContext.js`)

```jsx
import { useAuth } from './context/AuthContext';

const { user, loading, login, register, logout } = useAuth();
```

| Property | Type | Description |
|----------|------|-------------|
| `user` | Object\|null | Current user `{ id, name, email, role }` |
| `loading` | Boolean | True while verifying token on mount |
| `login(email, pass)` | Function | Logs in and stores token |
| `register(name, email, pass)` | Function | Registers and stores token |
| `logout()` | Function | Clears token and resets user |

---

## 📱 Responsive Design

The app is fully responsive with breakpoints:

| Breakpoint | Behavior |
|-----------|----------|
| `> 1024px` | Full layout — 3–4 column grids |
| `769px–1024px` | 2-column grids |
| `< 768px` | Mobile — hamburger nav, single column, stacked forms |
| `< 480px` | Compact — reduced font sizes, minimal padding |

**Mobile Navbar:**
- Desktop: horizontal link bar
- Mobile: hamburger button (☰) reveals a full-width dropdown menu
- Admin panel: separate fixed top bar + collapsible sidebar menu

---

## 🛡️ Route Guards

**Admin routes** (`/admin/*`) are protected by `AdminRoute`:
```jsx
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
};
```

Non-admin users who try to access `/admin/*` are redirected to home.

---

## 🏛️ Admin Panel Pages

### Overview (`/admin`)
- Live statistics cards: total issues, open/in-progress/resolved counts, users, total raised
- Category breakdown bar chart
- Status distribution with progress bars
- Recent issues, users, and donations feed

### Issue Management (`/admin/issues`)
- Full paginated table with status color coding
- Filters: search text, category, status, sort
- Inline "Edit" modal: change status + add admin note
- Bulk actions: select multiple → change status or delete all
- Delete individual issues

### User Management (`/admin/users`)
- Paginated user table with role badges
- Search by name or email, filter by role
- Promote/demote users between `user` and `admin`
- View user profile modal with their reported issues
- Delete user accounts

### Donation Management (`/admin/donations`)
- Full donation history table
- Real donor info (respects anonymous flag in public API, reveals it in admin)
- Filter by payment status
- Stats: page total, record count, average donation

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2 | UI framework |
| `react-dom` | ^18.2 | DOM rendering |
| `react-router-dom` | ^6.14 | Client-side routing |
| `axios` | ^1.4 | HTTP client |
| `react-hot-toast` | ^2.4 | Toast notifications |
| `react-scripts` | 5.0.1 | CRA build toolchain |

---

## 🌐 Environment Variables

Create a `.env` file in the `client/` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

For production:
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

> All React env vars **must** start with `REACT_APP_` to be accessible in the browser.

---

## 🏗️ Build for Production

```bash
npm run build
```

Outputs to `client/build/`. Deploy this folder to:
- **Vercel** — connect the repo, set root to `client/`, auto-deploy
- **Netlify** — drag-drop the `build/` folder or connect GitHub
- **Nginx** — serve `build/` with `try_files $uri /index.html`

---

## 🧩 Adding New Pages

1. Create `src/pages/MyPage.js`
2. Add route in `src/App.js`:
   ```jsx
   <Route path="/my-page" element={<PublicLayout><MyPage /></PublicLayout>} />
   ```
3. Add link to `Navbar.js` `navLinks` array if needed

---

## 🎯 Key Patterns

**Data fetching with loading state:**
```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  someAPI.getData()
    .then(r => setData(r.data))
    .catch(() => toast.error('Failed'))
    .finally(() => setLoading(false));
}, []);
```

**Conditional auth checks:**
```jsx
const { user } = useAuth();
const handleProtected = () => {
  if (!user) return toast.error('Please login first');
  // proceed...
};
```
