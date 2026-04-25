import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:5000/api";

const uniqueUser = () => {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    name: "Task API Tester",
    email: `task-api-${stamp}@unigear.test`,
    password: "password123",
  };
};

const registerUser = async (request) => {
  const res = await request.post(`${API_BASE}/auth/register`, {
    data: uniqueUser(),
  });

  expect(res.ok()).toBeTruthy();

  const body = await res.json();
  expect(body.token).toBeTruthy();
  expect(body.user?._id).toBeTruthy();

  return body;
};

const createTask = async (request, token, overrides = {}) => {
  const res = await request.post(`${API_BASE}/tasks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      description: "Deliver API test notes to the main library",
      category: "Delivery",
      budget: 1200,
      deadline: "2030-12-31T12:00:00.000Z",
      location: "Main Library",
      ...overrides,
    },
  });

  expect(res.status()).toBe(201);
  return res.json();
};

test.describe("Task API", () => {
  test("rejects task creation without authentication", async ({ request }) => {
    const res = await request.post(`${API_BASE}/tasks`, {
      data: {
        description: "Unauthenticated task should fail",
        category: "Delivery",
        budget: 500,
        deadline: "2030-12-31T12:00:00.000Z",
        location: "Campus gate",
      },
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Authentication required.");
  });

  test("creates, lists, edits, and deletes a pending task", async ({
    request,
  }) => {
    const { token } = await registerUser(request);
    const created = await createTask(request, token);

    expect(created._id).toBeTruthy();
    expect(created.status).toBe("Pending");
    expect(created.description).toContain("API test notes");

    const listRes = await request.get(`${API_BASE}/tasks`, {
      params: {
        search: "API test notes",
      },
    });
    expect(listRes.ok()).toBeTruthy();

    const tasks = await listRes.json();
    expect(tasks.some((task) => task._id === created._id)).toBeTruthy();

    const editRes = await request.patch(`${API_BASE}/tasks/${created._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        budget: 1500,
        location: "Engineering Faculty",
      },
    });
    expect(editRes.ok()).toBeTruthy();

    const edited = await editRes.json();
    expect(edited.budget).toBe(1500);
    expect(edited.location).toBe("Engineering Faculty");

    const deleteRes = await request.delete(`${API_BASE}/tasks/${created._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(deleteRes.ok()).toBeTruthy();

    const deleteBody = await deleteRes.json();
    expect(deleteBody.message).toBe("Task deleted successfully.");
  });

  test("updates task status for an authenticated user", async ({ request }) => {
    const { token } = await registerUser(request);
    const task = await createTask(request, token, {
      description: "Mark API task status as completed",
    });

    const statusRes = await request.put(`${API_BASE}/tasks/status/${task._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        status: "Completed",
      },
    });

    expect(statusRes.ok()).toBeTruthy();

    const updated = await statusRes.json();
    expect(updated._id).toBe(task._id);
    expect(updated.status).toBe("Completed");
  });
});
