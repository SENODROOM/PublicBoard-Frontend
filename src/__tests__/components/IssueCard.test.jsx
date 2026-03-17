import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Issue from '../models/Issue';
import issuesRoutes from '../routes/issues';

// ── Helpers ───────────────────────────────────────────────
// FIX: issues_test mounts ONLY the issues router. /api/auth does not exist
// in this app, so the previous login call silently returned 404 and authToken
// was undefined for every test that used it. We sign tokens directly here,
// the same pattern used in issues.routes.test.js.
process.env.JWT_SECRET         = 'test_secret_at_least_32_chars_long_xxx';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars_xx';
process.env.NODE_ENV           = 'test';

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Issues Routes', () => {
  let app;
  let mongoServer;
  let authToken;
  let adminToken;
  let testUser;
  let adminUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = express();
    app.use(express.json());
    app.locals.sseClients = new Set(); // required by broadcast util
    app.use('/api/issues', issuesRoutes);

    // FIX: create users and sign tokens directly — no auth route mounted here
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    authToken  = signToken(testUser._id);
    adminToken = signToken(adminUser._id);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Issue.deleteMany({});
  });

  // ── GET /api/issues ──────────────────────────────────────
  describe('GET /api/issues', () => {
    beforeEach(async () => {
      await Issue.create([
        {
          title: 'Issue 1',
          description: 'Description 1 long enough to pass validation',
          category: 'Infrastructure',
          location: 'Location 1',
          reporter: { name: 'Reporter 1', email: 'reporter1@example.com' },
          priority: 'High',
          status: 'Open',
        },
        {
          title: 'Issue 2',
          description: 'Description 2 long enough to pass validation',
          category: 'Safety',
          location: 'Location 2',
          reporter: { name: 'Reporter 2', email: 'reporter2@example.com' },
          priority: 'Medium',
          status: 'In Progress',
        },
      ]);
    });

    test('should get all issues', async () => {
      const response = await request(app).get('/api/issues').expect(200);

      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pages');
      expect(response.body.issues).toHaveLength(2);
    });

    test('should filter by status', async () => {
      const response = await request(app).get('/api/issues?status=Open').expect(200);

      expect(response.body.issues).toHaveLength(1);
      expect(response.body.issues[0].status).toBe('Open');
    });

    test('should filter by category', async () => {
      const response = await request(app).get('/api/issues?category=Infrastructure').expect(200);

      expect(response.body.issues).toHaveLength(1);
      expect(response.body.issues[0].category).toBe('Infrastructure');
    });

    test('should filter by priority', async () => {
      const response = await request(app).get('/api/issues?priority=High').expect(200);

      expect(response.body.issues).toHaveLength(1);
      expect(response.body.issues[0].priority).toBe('High');
    });

    test('should search issues by title', async () => {
      const response = await request(app).get('/api/issues?search=Issue+1').expect(200);

      expect(response.body.issues.length).toBeGreaterThanOrEqual(1);
      expect(response.body.issues.some((i) => i.title === 'Issue 1')).toBe(true);
    });

    test('should paginate results', async () => {
      for (let i = 3; i <= 25; i++) {
        await Issue.create({
          title: `Issue ${i}`,
          description: `Description ${i} long enough to pass`,
          category: 'Other',
          location: `Location ${i}`,
          reporter: { name: `Reporter ${i}`, email: `reporter${i}@example.com` },
        });
      }

      const response = await request(app).get('/api/issues?page=1&limit=10').expect(200);

      expect(response.body.issues).toHaveLength(10);
      expect(response.body.page).toBe(1);
      expect(response.body.pages).toBeGreaterThan(1);
    });

    test('respects maximum limit cap of 100', async () => {
      const response = await request(app).get('/api/issues?limit=999').expect(200);
      expect(response.body.issues.length).toBeLessThanOrEqual(100);
    });
  });

  // ── GET /api/issues/stats ────────────────────────────────
  describe('GET /api/issues/stats', () => {
    beforeEach(async () => {
      await Issue.create([
        { title: 'Open Issue', description: 'desc long enough', category: 'Infrastructure', location: 'loc', status: 'Open',        reporter: { name: 'T', email: 't@t.com' } },
        { title: 'InProg Issue', description: 'desc long enough', category: 'Safety',         location: 'loc', status: 'In Progress', reporter: { name: 'T', email: 't@t.com' } },
        { title: 'Resolved Issue', description: 'desc long enough', category: 'Sanitation',     location: 'loc', status: 'Resolved',   reporter: { name: 'T', email: 't@t.com' } },
      ]);
    });

    test('should get issue statistics', async () => {
      const response = await request(app).get('/api/issues/stats').expect(200);

      expect(response.body).toHaveProperty('total', 3);
      expect(response.body).toHaveProperty('open', 1);
      expect(response.body).toHaveProperty('inProgress', 1);
      expect(response.body).toHaveProperty('resolved', 1);
      expect(response.body).toHaveProperty('priorityBreakdown');
      expect(response.body).toHaveProperty('topTags');
      expect(response.body).toHaveProperty('neighborhoods');
    });
  });

  // ── GET /api/issues/:id ──────────────────────────────────
  describe('GET /api/issues/:id', () => {
    test('should get single issue and increment view count', async () => {
      const issue = await Issue.create({
        title: 'Test Issue',
        description: 'Test Description long enough',
        category: 'Infrastructure',
        location: 'Test Location',
        reporter: { name: 'Test Reporter', email: 'reporter@example.com' },
        views: 5,
      });

      const response = await request(app).get(`/api/issues/${issue._id}`).expect(200);

      expect(response.body.issue.title).toBe('Test Issue');
      expect(response.body.issue.views).toBe(6);
    });

    test('should return 404 for non-existent issue', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/issues/${fakeId}`).expect(404);

      expect(response.body.message).toMatch(/not found/i);
    });
  });

  // ── POST /api/issues ─────────────────────────────────────
  describe('POST /api/issues', () => {
    test('should create new issue without auth', async () => {
      const issueData = {
        title: 'New Issue Title Here',
        description: 'This is a new issue description that is at least 20 characters long',
        category: 'Infrastructure',
        location: 'Test Location',
        priority: 'High',
        tags: ['tag1', 'tag2'],
        reporter: { name: 'Test Reporter', email: 'reporter@example.com' },
      };

      const response = await request(app).post('/api/issues').send(issueData).expect(201);

      expect(response.body.issue.title).toBe('New Issue Title Here');
      expect(response.body.issue.category).toBe('Infrastructure');
      expect(response.body.issue.status).toBe('Open');
      expect(response.body.issue.supportCount).toBe(0);
    });

    test('should create issue with authenticated user — reporter locked to req.user', async () => {
      const issueData = {
        title: 'Authenticated Issue Title',
        description: 'This is an issue created by an authenticated user that is at least 20 characters',
        category: 'Safety',
        location: 'Test Location',
        // reporter is intentionally omitted — server should use req.user
      };

      const response = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send(issueData)
        .expect(201);

      // FIX: verify the anti-spoofing behaviour — reporter comes from req.user, not body
      expect(response.body.issue.reporter.name).toBe('Test User');
      expect(response.body.issue.reporter.email).toBe('test@example.com');
      expect(response.body.issue.reporter.userId).toBe(testUser._id.toString());
    });

    test('reporter body fields are ignored when user is authenticated', async () => {
      const issueData = {
        title: 'Spoofed Reporter Issue',
        description: 'Attempting to spoof reporter identity, must be ignored by server',
        category: 'Safety',
        location: 'Test Location',
        reporter: { name: 'HACKER', email: 'hacker@evil.com', userId: new mongoose.Types.ObjectId() },
      };

      const response = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send(issueData)
        .expect(201);

      expect(response.body.issue.reporter.name).toBe('Test User');
      expect(response.body.issue.reporter.email).toBe('test@example.com');
      expect(response.body.issue.reporter.userId).toBe(testUser._id.toString());
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/issues')
        .send({ title: 'Test Issue' }) // missing description, category, location
        .expect(400);

      expect(response.body.message).toBeTruthy();
    });

    test('should return 400 for title shorter than 5 chars', async () => {
      const response = await request(app)
        .post('/api/issues')
        .send({
          title: 'Hi',
          description: 'This description is definitely long enough at 20+ chars',
          category: 'Infrastructure',
          location: 'Test Location',
          reporter: { name: 'Test', email: 'test@t.com' },
        })
        .expect(400);

      expect(response.body.message).toMatch(/5 characters/i);
    });

    test('should return 400 for description shorter than 20 chars', async () => {
      const response = await request(app)
        .post('/api/issues')
        .send({
          title: 'Valid Title Here',
          description: 'Too short',
          category: 'Infrastructure',
          location: 'Test Location',
          reporter: { name: 'Test', email: 'test@t.com' },
        })
        .expect(400);

      expect(response.body.message).toMatch(/20 characters/i);
    });

    test('should return 400 for invalid category', async () => {
      const response = await request(app)
        .post('/api/issues')
        .send({
          title: 'Valid Title Here',
          description: 'This description is long enough to pass the minimum',
          category: 'NotACategory',
          location: 'Test Location',
          reporter: { name: 'Test', email: 'test@t.com' },
        })
        .expect(400);

      expect(response.body.message).toBeTruthy();
    });

    test('awards reputation when authenticated user creates issue', async () => {
      await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Rep Award Issue',
          description: 'This is long enough to pass the minimum check for description',
          category: 'Infrastructure',
          location: 'Test Location',
        })
        .expect(201);

      const updated = await User.findById(testUser._id);
      expect(updated.reputation).toBeGreaterThanOrEqual(10);
      expect(updated.stats.issuesReportedCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ── POST /api/issues/:id/support ─────────────────────────
  describe('POST /api/issues/:id/support', () => {
    let issue;

    beforeEach(async () => {
      issue = await Issue.create({
        title: 'Test Issue',
        description: 'Test description long enough',
        category: 'Infrastructure',
        location: 'Test Location',
        reporter: { name: 'Test Reporter', email: 'reporter@example.com' },
        supportCount: 2,
        supporters: [new mongoose.Types.ObjectId()],
      });
    });

    test('should support issue', async () => {
      const response = await request(app)
        .post(`/api/issues/${issue._id}/support`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.issue.supportCount).toBe(3);
      expect(response.body.supported).toBe(true);
    });

    test('should unsupport already supported issue (toggle)', async () => {
      issue.supporters.push(testUser._id);
      issue.supportCount = 3;
      await issue.save();

      const response = await request(app)
        .post(`/api/issues/${issue._id}/support`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.issue.supportCount).toBe(2);
      expect(response.body.supported).toBe(false);
    });

    test('should return 401 for unauthenticated request', async () => {
      await request(app).post(`/api/issues/${issue._id}/support`).expect(401);
    });

    test('should return 404 for non-existent issue', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .post(`/api/issues/${fakeId}/support`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  // ── POST /api/issues/:id/comments ────────────────────────
  describe('POST /api/issues/:id/comments', () => {
    let issue;

    beforeEach(async () => {
      issue = await Issue.create({
        title: 'Test Issue',
        description: 'Test description long enough',
        category: 'Infrastructure',
        location: 'Test Location',
        reporter: { name: 'Test Reporter', email: 'reporter@example.com' },
        comments: [],
      });
    });

    test('should add comment to issue', async () => {
      const response = await request(app)
        .post(`/api/issues/${issue._id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'This is a test comment' })
        .expect(201);

      expect(response.body.issue.comments).toHaveLength(1);
      expect(response.body.issue.comments[0].text).toBe('This is a test comment');
      expect(response.body.issue.comments[0].author.name).toBe('Test User');
    });

    test('should return 400 for empty comment', async () => {
      const response = await request(app)
        .post(`/api/issues/${issue._id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: '' })
        .expect(400);

      expect(response.body.message).toMatch(/required/i);
    });

    test('should return 400 for whitespace-only comment', async () => {
      const response = await request(app)
        .post(`/api/issues/${issue._id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: '   ' })
        .expect(400);

      expect(response.body.message).toMatch(/required/i);
    });

    test('should return 401 for unauthenticated request', async () => {
      await request(app)
        .post(`/api/issues/${issue._id}/comments`)
        .send({ text: 'Test comment' })
        .expect(401);
    });

    test('should extract @mentions from comment text', async () => {
      await User.create({
        name: 'MentionedUser',
        email: 'mentioned@example.com',
        password: 'password123',
      });

      const response = await request(app)
        .post(`/api/issues/${issue._id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Hey @MentionedUser, check this out!' })
        .expect(201);

      expect(response.body.issue.comments[0].mentions).toContain('MentionedUser');
    });
  });

  // ── PATCH /api/issues/:id/status ─────────────────────────
  describe('PATCH /api/issues/:id/status', () => {
    let issue;

    beforeEach(async () => {
      issue = await Issue.create({
        title: 'Test Issue',
        description: 'Test description long enough',
        category: 'Infrastructure',
        location: 'Test Location',
        reporter: { name: 'Test Reporter', email: 'reporter@example.com', userId: testUser._id },
        status: 'Open',
      });
    });

    test('should update issue status as reporter', async () => {
      const response = await request(app)
        .patch(`/api/issues/${issue._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'In Progress', message: 'Working on this issue' })
        .expect(200);

      expect(response.body.issue.status).toBe('In Progress');
      expect(response.body.issue.updates).toHaveLength(1);
      expect(response.body.issue.updates[0].message).toBe('Working on this issue');
    });

    test('should set resolvedAt and resolutionTimeHours when Resolved', async () => {
      const response = await request(app)
        .patch(`/api/issues/${issue._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'Resolved' })
        .expect(200);

      expect(response.body.issue.status).toBe('Resolved');
      expect(response.body.issue.resolvedAt).toBeDefined();
      expect(response.body.issue.resolutionTimeHours).toBeGreaterThanOrEqual(0);
    });

    test('should return 403 for user who is not the reporter or admin', async () => {
      const other = await User.create({ name: 'Other', email: 'other@example.com', password: 'password123' });
      const otherToken = signToken(other._id);

      await request(app)
        .patch(`/api/issues/${issue._id}/status`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ status: 'In Progress' })
        .expect(403);
    });

    test('should return 400 for missing status field', async () => {
      const response = await request(app)
        .patch(`/api/issues/${issue._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Test message' }) // no status
        .expect(400);

      expect(response.body.message).toMatch(/status is required/i);
    });

    test('admin can update status on any issue', async () => {
      const response = await request(app)
        .patch(`/api/issues/${issue._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Resolved' })
        .expect(200);

      expect(response.body.issue.status).toBe('Resolved');
    });
  });

  // ── DELETE /api/issues/:id ───────────────────────────────
  describe('DELETE /api/issues/:id', () => {
    test('should delete issue as admin', async () => {
      const issue = await Issue.create({
        title: 'Test Issue',
        description: 'Test description long enough',
        category: 'Infrastructure',
        location: 'Test Location',
        reporter: { name: 'Test Reporter', email: 'reporter@example.com' },
      });

      const response = await request(app)
        .delete(`/api/issues/${issue._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toMatch(/deleted/i);
      expect(await Issue.findById(issue._id)).toBeNull();
    });

    test('should return 403 for non-admin user', async () => {
      const issue = await Issue.create({
        title: 'Test Issue',
        description: 'Test description long enough',
        category: 'Infrastructure',
        location: 'Test Location',
        reporter: { name: 'Test Reporter', email: 'reporter@example.com' },
      });

      const response = await request(app)
        .delete(`/api/issues/${issue._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.message).toBeTruthy();
    });

    test('should return 404 for already deleted issue', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/issues/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});