const adminUser = {
  _id: '65f0f0f0f0f0f0f0f0f0f0aa',
  name: 'Admin User',
  email: 'admin@unigear.test',
  role: 'admin',
  trustScore: 5,
};

const studentUser = {
  _id: '75f0f0f0f0f0f0f0f0f0f0bb',
  name: 'Student User',
  email: 'student@unigear.test',
  role: 'student',
  trustScore: 4.3,
};

const seedAdminState = () => ({
  rentals: [
    {
      _id: 'r1',
      title: 'Oscilloscope',
      description: 'Lab-grade scope',
      category: 'Electronics',
      dailyRate: 1200,
      moderationStatus: 'pending',
      owner: { _id: 'u1', name: 'Alice', email: 'alice@test.com' },
      createdAt: '2026-04-01T08:00:00.000Z',
    },
    {
      _id: 'r2',
      title: 'Tripod',
      description: 'Camera tripod',
      category: 'Other',
      dailyRate: 400,
      moderationStatus: 'pending',
      owner: { _id: 'u9', name: 'Ivan', email: 'ivan@test.com' },
      createdAt: '2026-04-05T08:00:00.000Z',
    },
  ],
  tasks: [
    {
      _id: 't1',
      description: 'Fix lab PC setup',
      category: 'Technical',
      budget: 3000,
      location: 'Engineering Lab',
      deadline: '2026-04-30T10:00:00.000Z',
      moderationStatus: 'pending',
      creator: { _id: 'u2', name: 'Bob', email: 'bob@test.com' },
      createdAt: '2026-04-02T08:00:00.000Z',
      status: 'Pending',
    },
  ],
  users: [
    {
      _id: 'u2',
      name: 'Bob',
      email: 'bob@test.com',
      role: 'student',
      isVerified: true,
      trustScore: 4.2,
      isSuspended: false,
      createdAt: '2026-04-01T08:00:00.000Z',
    },
  ],
  disputes: [
    {
      _id: 'd1',
      targetType: 'Rental',
      reason: 'Damaged when received',
      status: 'pending',
      reporter: { _id: 'u3', name: 'Chris', email: 'chris@test.com' },
      reportedUser: { _id: 'u4', name: 'Dana', email: 'dana@test.com' },
      resolutionNote: '',
      createdAt: '2026-04-03T08:00:00.000Z',
      messages: [],
    },
    {
      _id: 'd2',
      targetType: 'Task',
      reason: 'Task payout mismatch',
      status: 'pending',
      reporter: { _id: 'u5', name: 'Evan', email: 'evan@test.com' },
      reportedUser: { _id: 'u6', name: 'Faith', email: 'faith@test.com' },
      resolutionNote: '',
      createdAt: '2026-04-04T08:00:00.000Z',
      messages: [],
    },
    {
      _id: 'd3',
      targetType: 'Rental',
      reason: 'Legacy closed dispute',
      status: 'resolved',
      reporter: { _id: 'u7', name: 'Glen', email: 'glen@test.com' },
      reportedUser: { _id: 'u8', name: 'Hana', email: 'hana@test.com' },
      resolutionNote: 'Already handled',
      createdAt: '2026-03-20T08:00:00.000Z',
      messages: [],
    },
  ],
  settings: {
    maintenanceMode: false,
    staleItemDays: 30,
    allowedRentalCategories: ['Electronics', 'Sports'],
    allowedTaskCategories: ['Technical', 'Academic'],
  },
  auditLogs: [
    {
      _id: 'log1',
      action: 'admin_login',
      targetType: 'user',
      targetId: adminUser._id,
      admin: adminUser,
      createdAt: '2026-04-10T08:00:00.000Z',
      details: {},
    },
  ],
  analytics: {
    rentals: { pending: 2, approved: 0, rejected: 0, avgModerationHours: 1.2 },
    tasks: { pending: 1, approved: 0, rejected: 0, avgModerationHours: 2.4 },
    overall: { pending: 3, approved: 0, rejected: 0 },
    trends: [],
  },
  queueStats: {
    staleRentals: 0,
    staleTasks: 0,
    recentRejectedRentals: 0,
    recentRejectedTasks: 0,
  },
});

const seedUserDisputeState = () => ({
  profile: {
    ...studentUser,
  },
  myItems: [],
  myTasks: [
    {
      _id: 'task-progress-1',
      description: 'Deliver project camera',
      budget: 1500,
      status: 'In Progress',
      creator: { _id: 'u-creator-1', name: 'Task Owner' },
      category: 'Delivery',
      location: 'Hostel Block B',
    },
    {
      _id: 'task-complete-1',
      description: 'Repair keyboard',
      budget: 1200,
      status: 'Completed',
      creator: { _id: 'u-creator-2', name: 'Task Owner 2' },
      category: 'Technical',
      location: 'Lab 3',
    },
  ],
  transactions: [],
  myBookings: [
    {
      _id: 'booking-1',
      status: 'active',
      startDate: '2026-04-10T00:00:00.000Z',
      endDate: '2026-04-12T00:00:00.000Z',
      item: {
        _id: 'rental-1',
        title: 'Camera Kit',
        category: 'Electronics',
        dailyRate: 1000,
        owner: { _id: 'owner-1', name: 'Rental Owner' },
        photos: [],
      },
    },
  ],
  disputes: [
    {
      _id: 'user-dispute-1',
      targetType: 'Task',
      reason: 'Need escalation',
      status: 'pending',
      reportedUser: { _id: 'u-creator-1', name: 'Task Owner' },
      createdAt: '2026-04-12T08:00:00.000Z',
      messages: [],
    },
  ],
});

async function installAdminApiMocks(page) {
  const state = seedAdminState();

  await page.route('**/api/admin/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();
    let body = {};
    if (req.postData()) {
      try {
        body = req.postDataJSON();
      } catch {
        body = {};
      }
    }

    const ok = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    const created = (data) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET' && path.endsWith('/admin/rentals')) return ok(state.rentals);
    if (method === 'GET' && path.endsWith('/admin/tasks')) return ok(state.tasks);
    if (method === 'GET' && path.endsWith('/admin/users')) return ok(state.users);
    if (method === 'GET' && path.endsWith('/admin/analytics')) return ok(state.analytics);
    if (method === 'GET' && path.endsWith('/admin/queue-stats')) return ok(state.queueStats);
    if (method === 'GET' && path.endsWith('/admin/disputes')) return ok(state.disputes);
    if (method === 'GET' && path.endsWith('/admin/settings')) return ok(state.settings);
    if (method === 'GET' && path.endsWith('/admin/audit-logs')) return ok({ items: state.auditLogs, total: state.auditLogs.length });

    if (method === 'PATCH' && path.includes('/admin/rentals/') && path.endsWith('/moderate')) {
      const id = path.split('/').slice(-2, -1)[0];
      state.rentals = state.rentals.map((r) => (r._id === id ? { ...r, moderationStatus: body.moderationStatus } : r));
      return ok(state.rentals.find((r) => r._id === id));
    }

    if (method === 'PATCH' && path.endsWith('/admin/rentals/bulk-moderate')) {
      const ids = body.ids || [];
      state.rentals = state.rentals.map((r) => (ids.includes(r._id) ? { ...r, moderationStatus: body.moderationStatus } : r));
      return ok({ message: 'Bulk done' });
    }

    if (method === 'PATCH' && path.includes('/admin/tasks/') && path.endsWith('/moderate')) {
      const id = path.split('/').slice(-2, -1)[0];
      state.tasks = state.tasks.map((t) => (t._id === id ? { ...t, moderationStatus: body.moderationStatus } : t));
      return ok(state.tasks.find((t) => t._id === id));
    }

    if (method === 'PATCH' && path.includes('/admin/users/')) {
      const id = path.split('/').pop();
      state.users = state.users.map((u) => (u._id === id ? { ...u, ...body } : u));
      return ok(state.users.find((u) => u._id === id));
    }

    if (method === 'DELETE' && path.includes('/admin/audit-logs/')) {
      const id = path.split('/').pop();
      state.auditLogs = state.auditLogs.filter((l) => l._id !== id);
      return ok({ message: 'Audit log deleted successfully' });
    }

    if (method === 'PATCH' && path.includes('/admin/disputes/') && path.endsWith('/resolve')) {
      const id = path.split('/').slice(-2, -1)[0];
      state.disputes = state.disputes.map((d) =>
        d._id === id ? { ...d, status: body.status, resolutionNote: body.resolutionNote || '' } : d
      );
      return ok(state.disputes.find((d) => d._id === id));
    }

    if (method === 'POST' && path.includes('/admin/disputes/') && path.endsWith('/message')) {
      const id = path.split('/').slice(-2, -1)[0];
      const target = state.disputes.find((d) => d._id === id);
      if (!target) return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not found' }) });
      target.messages.push({
        sender: { _id: adminUser._id, name: adminUser.name },
        isAdmin: true,
        content: body.content,
        createdAt: new Date().toISOString(),
      });
      return created(target);
    }

    if (method === 'DELETE' && path.includes('/admin/disputes/')) {
      const id = path.split('/').pop();
      state.disputes = state.disputes.filter((d) => d._id !== id);
      return ok({ message: 'Dispute deleted successfully' });
    }

    if (method === 'PUT' && path.endsWith('/admin/settings')) {
      state.settings = { ...state.settings, ...body };
      return ok(state.settings);
    }

    return ok({});
  });
}

async function installUserDisputeApiMocks(page) {
  const state = seedUserDisputeState();

  await page.route('**/api/users/me', async (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.profile) })
  );
  await page.route('**/api/rentals/my-items', async (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.myItems) })
  );
  await page.route('**/api/tasks/my-tasks', async (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.myTasks) })
  );
  await page.route('**/api/transactions', async (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.transactions) })
  );
  await page.route('**/api/rentals/my-bookings', async (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.myBookings) })
  );

  await page.route('**/api/disputes/mine', async (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.disputes) })
  );

  await page.route('**/api/disputes', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') {
      return route.continue();
    }
    const body = req.postDataJSON();
    const reportedUserId = body.reportedUser;
    const newDispute = {
      _id: `user-dispute-${state.disputes.length + 1}`,
      targetType: body.targetType,
      targetId: body.targetId,
      reportedUser: { _id: reportedUserId, name: 'Reported User' },
      reason: body.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      messages: [],
    };
    state.disputes.unshift(newDispute);
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newDispute) });
  });

  await page.route('**/api/disputes/*/message', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const disputeId = path.split('/').slice(-2, -1)[0];
    const target = state.disputes.find((d) => d._id === disputeId);
    if (!target) {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not found' }) });
    }
    const body = req.postDataJSON();
    const msg = {
      sender: { _id: studentUser._id, name: studentUser.name },
      isAdmin: false,
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    target.messages.push(msg);
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(target) });
  });
}

module.exports = {
  adminUser,
  studentUser,
  installAdminApiMocks,
  installUserDisputeApiMocks,
};
