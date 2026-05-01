import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import type { MemberProgress, Task, Workspace, WorkspaceMember } from "../api/api";

type CurrentUser = {
  id: number;
  email: string;
};

type DashboardProps = {
  currentUser: CurrentUser;
};

type Mode = "create" | "show";

export default function Dashboard({ currentUser }: DashboardProps) {
  const [mode, setMode] = useState<Mode>("show");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [kebabWorkspaceId, setKebabWorkspaceId] = useState<number | null>(null);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memberProgress, setMemberProgress] = useState<MemberProgress[]>([]);

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [memberUserId, setMemberUserId] = useState("");
  const [memberUserEmail, setMemberUserEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "member">("member");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignUserId, setTaskAssignUserId] = useState("");

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [selectedNotificationTask, setSelectedNotificationTask] = useState<Task | null>(null);
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);

  // Derived views for dashboard summary
  const overdueTasks = assignedTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');
  const statusCounts = {
    todo: assignedTasks.filter(t => t.status === 'todo').length,
    in_progress: assignedTasks.filter(t => t.status === 'in_progress').length,
    done: assignedTasks.filter(t => t.status === 'done').length,
  };

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [workspaces, selectedWorkspaceId],
  );

  const isSelectedWorkspaceAdmin = selectedWorkspace?.current_user_role === "admin";

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (typeof err === "object" && err !== null && "response" in err) {
      const response = (err as { response?: { data?: { detail?: string } } }).response;
      if (response?.data?.detail) {
        return response.data.detail;
      }
    }
    return fallback;
  };

  const loadWorkspaces = async () => {
    const response = await API.get<Workspace[]>("/workspaces");
    setWorkspaces(response.data);

    if (response.data.length === 0) {
      setSelectedWorkspaceId(null);
      setMembers([]);
      setTasks([]);
      setMemberProgress([]);
      return;
    }

    const hasSelected = selectedWorkspaceId && response.data.some((workspace) => workspace.id === selectedWorkspaceId);
    if (!hasSelected) {
      setSelectedWorkspaceId(response.data[0].id);
    }
  };

  const loadSelectedWorkspaceDetails = async (workspaceId: number) => {
    const [membersResponse, tasksResponse, progressResponse] = await Promise.all([
      API.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
      API.get<Task[]>(`/workspaces/${workspaceId}/tasks`),
      API.get<MemberProgress[]>(`/workspaces/${workspaceId}/member-progress`),
    ]);
    setMembers(membersResponse.data);
    setTasks(tasksResponse.data);
    setMemberProgress(progressResponse.data);
  };

  const loadAssignedTasks = async () => {
    try {
      const response = await API.get<Task[]>("/tasks/assigned");
      setAssignedTasks(response.data);
    } catch (err: unknown) {
      console.error("Failed to load assigned tasks", err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadWorkspaces();
      await loadAssignedTasks();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load workspaces"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      return;
    }

    const run = async () => {
      try {
        await loadSelectedWorkspaceDetails(selectedWorkspaceId);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load workspace details"));
      }
    };
    void run();
  }, [selectedWorkspaceId, workspaces]);

  const withRefresh = async (operation: () => Promise<void>, fallbackError: string) => {
    setError(null);
    try {
      await operation();
      await refreshAll();
      if (selectedWorkspaceId) {
        await loadSelectedWorkspaceDetails(selectedWorkspaceId);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, fallbackError));
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      setError("Workspace name is required");
      return;
    }

    await withRefresh(async () => {
      const response = await API.post<Workspace>("/workspaces", { name: newWorkspaceName.trim() });
      setNewWorkspaceName("");
      setMode("show");
      setSelectedWorkspaceId(response.data.id);
    }, "Failed to create workspace");
  };

  const renameWorkspace = async (workspaceId: number, name: string) => {
    if (!name.trim()) {
      setError("Workspace name is required");
      return;
    }

    await withRefresh(async () => {
      await API.put(`/workspaces/${workspaceId}`, { name: name.trim() });
    }, "Failed to rename workspace");
  };

  const deleteWorkspace = async (workspaceId: number) => {
    if (!window.confirm("Delete this workspace?")) {
      return;
    }

    await withRefresh(async () => {
      await API.delete(`/workspaces/${workspaceId}`);
      if (selectedWorkspaceId === workspaceId) {
        setSelectedWorkspaceId(null);
        setMembers([]);
        setTasks([]);
        setMemberProgress([]);
      }
    }, "Failed to delete workspace");
  };

  const addMember = async () => {
    if (!selectedWorkspaceId) {
      setError("Select a workspace first");
      return;
    }

    if (!memberUserId.trim() || !memberUserEmail.trim()) {
      setError("User ID and email are required");
      return;
    }

    const parsedUserId = Number(memberUserId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      setError("User ID must be a positive number");
      return;
    }

    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailPattern.test(memberUserEmail.trim())) {
      setError("Enter a valid email address");
      return;
    }

    await withRefresh(async () => {
      await API.post(`/workspaces/${selectedWorkspaceId}/members`, null, {
        params: { user_id: parsedUserId, user_email: memberUserEmail.trim(), role: memberRole },
      });
      setMemberUserId("");
      setMemberUserEmail("");
      setMemberRole("member");
    }, "Failed to add member");
  };

  const removeMember = async (userId: number) => {
    if (!selectedWorkspaceId) {
      return;
    }
    if (!window.confirm("Remove this member?")) {
      return;
    }

    await withRefresh(async () => {
      await API.delete(`/workspaces/${selectedWorkspaceId}/members/${userId}`);
    }, "Failed to remove member");
  };

  const createTask = async () => {
    if (!selectedWorkspaceId || !taskTitle.trim()) {
      setError("Task title is required");
      return;
    }

    // Build assignees list from input
    const assignees: number[] = [];
    if (taskAssignUserId.trim()) {
      const userId = Number(taskAssignUserId);
      if (!Number.isInteger(userId) || userId <= 0) {
        setError("Assigned user ID must be a positive number");
        return;
      }
      assignees.push(userId);
    }

    await withRefresh(async () => {
      await API.post("/tasks", {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        status: "todo",
        priority: taskPriority,
        due_date: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        workspace_id: selectedWorkspaceId,
        assignees: assignees.length > 0 ? assignees : undefined,
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setTaskDueDate("");
      setTaskAssignUserId("");
    }, "Failed to create task");
  };

  const updateTaskStatus = async (taskId: number, status: Task["status"]) => {
    await withRefresh(async () => {
      await API.patch(`/tasks/${taskId}/status`, { status });
    }, "Failed to update task status");
  };

  const addTaskAssignee = async (task: Task, userId: number) => {
    if (task.assignees.some(a => a.id === userId)) {
      setError("User already assigned to this task");
      return;
    }

    await withRefresh(async () => {
      await API.post(`/tasks/${task.id}/assignees`, { user_id: userId });
    }, "Failed to add assignee");
  };

  const removeTaskAssignee = async (task: Task, userId: number) => {
    await withRefresh(async () => {
      await API.delete(`/tasks/${task.id}/assignees/${userId}`);
    }, "Failed to remove assignee");
  };

  const deleteTaskDirectly = async (taskId: number) => {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    await withRefresh(async () => {
      await API.delete(`/tasks/${taskId}`);
    }, "Failed to delete task");
  };

  return (
    <section className="card">
      <div className="card-header">
        <p className="card-kicker">Dashboard</p>
        <h2 className="card-title">Team Task Manager</h2>
        <p className="card-subtitle">Signed in as {currentUser.email}</p>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="workspace-meta">Loading...</p> : null}

      <div className="dashboard-primary-actions">
        <button
          className="btn btn-primary"
          onClick={() => setMode("create")}
        >
          Create Workspace
        </button>
        <div className="dashboard-primary-actions-right">
          <button className="btn btn-secondary" onClick={() => setMode("show")}>
            Show Workspaces
          </button>
          <button 
            className="btn btn-info"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔 Notifications ({assignedTasks.length})
          </button>
        </div>
      </div>

      {/* Dashboard summary: Tasks / Status / Overdue */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <h4>Tasks</h4>
          {assignedTasks.length === 0 ? (
            <p className="empty-subtitle">No tasks assigned to you</p>
          ) : (
            <ul className="summary-list">
              {assignedTasks.slice(0, 5).map((t) => (
                <li key={t.id}>{t.title}{t.due_date ? ` — ${new Date(t.due_date).toLocaleDateString()}` : ''}</li>
              ))}
            </ul>
          )}
          {assignedTasks.length > 5 ? <p className="hint-text">And {assignedTasks.length - 5} more...</p> : null}
        </div>

        <div className="summary-card">
          <h4>Status</h4>
          <div className="status-chips">
            <span className="chip chip-todo">Todo: {statusCounts.todo}</span>
            <span className="chip chip-progress">In Progress: {statusCounts.in_progress}</span>
            <span className="chip chip-done">Done: {statusCounts.done}</span>
          </div>
        </div>

        <div className="summary-card">
          <h4>Overdue</h4>
          {overdueTasks.length === 0 ? (
            <p className="empty-subtitle">No overdue tasks</p>
          ) : (
            <ul className="summary-list">
              {overdueTasks.slice(0, 5).map((t) => (
                <li key={t.id}>{t.title} — due {new Date(t.due_date!).toLocaleString()}</li>
              ))}
            </ul>
          )}
          {overdueTasks.length > 5 ? <p className="hint-text">And {overdueTasks.length - 5} more...</p> : null}
        </div>
      </div>

      {mode === "create" ? (
        <div className="create-panel">
          <h3 className="section-title">Create Workspace</h3>
          <div className="workspace-form">
            <input
              className="input"
              value={newWorkspaceName}
              onChange={(event) => setNewWorkspaceName(event.target.value)}
              placeholder="Workspace name"
            />
            <button className="btn btn-primary" onClick={createWorkspace}>
              Create
            </button>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="workspace-panel">
            <h3 className="section-title">Workspaces</h3>
            <div className="workspace-list">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className={`workspace-row ${workspace.id === selectedWorkspaceId ? "active" : ""}`}>
                  <button className="workspace-row-main" onClick={() => setSelectedWorkspaceId(workspace.id)}>
                    <span>{workspace.name}</span>
                    <span className="workspace-meta">{workspace.current_user_role}</span>
                  </button>
                  {workspace.current_user_role === "admin" ? (
                    <div className="workspace-menu-wrap">
                      <button className="kebab-btn" onClick={() => setKebabWorkspaceId(kebabWorkspaceId === workspace.id ? null : workspace.id)}>
                        ...
                      </button>
                      {kebabWorkspaceId === workspace.id ? (
                        <div className="kebab-menu">
                          <button
                            className="kebab-item"
                            onClick={() => {
                              const nextName = window.prompt("Rename workspace", workspace.name);
                              setKebabWorkspaceId(null);
                              if (nextName !== null) {
                                void renameWorkspace(workspace.id, nextName);
                              }
                            }}
                          >
                            Rename
                          </button>
                          <button
                            className="kebab-item kebab-item-danger"
                            onClick={() => {
                              setKebabWorkspaceId(null);
                              void deleteWorkspace(workspace.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-panel">
            {selectedWorkspace ? (
              <>
                <div className="create-panel">
                  <p className="section-kicker">Members</p>
                  <h3 className="section-title">Workspace Members</h3>
                  <div className="workspace-list">
                    {members.map((member) => (
                      <div key={member.id} className="workspace-pill">
                        <span>{member.user_email ?? `User #${member.user_id}`}</span>
                        <span className="workspace-meta">{member.role}</span>
                        {isSelectedWorkspaceAdmin && member.user_id !== currentUser.id ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => void removeMember(member.user_id)}>
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {isSelectedWorkspaceAdmin ? (
                    <div className="create-form">
                      <input
                        className="input"
                        placeholder="User ID"
                        value={memberUserId}
                        onChange={(event) => setMemberUserId(event.target.value)}
                      />
                      <input
                        className="input"
                        placeholder="User email"
                        value={memberUserEmail}
                        onChange={(event) => setMemberUserEmail(event.target.value)}
                      />
                      <select className="input" value={memberRole} onChange={(event) => setMemberRole(event.target.value as "admin" | "member")}>
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                      <button className="btn btn-primary" onClick={addMember}>
                        Add Member
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="create-panel">
                  <p className="section-kicker">Tasks</p>
                  <h3 className="section-title">Create Task</h3>
                  <div className="task-create-layout">
                    <div className="task-create-row task-create-row-top">
                      <input className="input" placeholder="Task title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
                      <label className="field compact-field">
                        <span>Priority (low, medium, high)</span>
                        <select className="input" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as "low" | "medium" | "high")}>
                          <option value="low">low</option>
                          <option value="medium">medium</option>
                          <option value="high">high</option>
                        </select>
                      </label>
                    </div>

                    <textarea
                      className="input task-description"
                      placeholder="Description"
                      rows={4}
                      value={taskDescription}
                      onChange={(event) => setTaskDescription(event.target.value)}
                    />

                    <div className="task-create-row task-create-row-bottom">
                      <input className="input" type="datetime-local" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} />
                      <input
                        className="input"
                        placeholder="Assign user ID (optional)"
                        value={taskAssignUserId}
                        onChange={(event) => setTaskAssignUserId(event.target.value)}
                      />
                      <button className="btn btn-primary" onClick={createTask}>
                        Create Task
                      </button>
                    </div>
                  </div>
                </div>

                <div className="task-panel">
                  <h3 className="section-title">Workspace Tasks</h3>
                  <div className="task-grid">
                    {tasks.map((task) => (
                      <div key={task.id} className="task-card">
                        <div className="task-card-header">
                          <h4>{task.title}</h4>
                          <span className={`chip chip-${task.priority}`}>{task.priority}</span>
                        </div>
                        <p className="task-description-preview">{task.description ? task.description.substring(0, 100) + (task.description.length > 100 ? "..." : "") : "No description"}</p>
                        <p className="task-status">
                          Assigned: {task.assignees.length > 0 ? task.assignees.map(a => `USER ID ${a.id}`).join(", ") : "Unassigned"}
                        </p>
                        <div className="task-actions">
                          <select className="input" value={task.status} onChange={(event) => void updateTaskStatus(task.id, event.target.value as Task["status"])}>
                            <option value="todo">todo</option>
                            <option value="in_progress">in_progress</option>
                            <option value="done">done</option>
                          </select>
                          {isSelectedWorkspaceAdmin ? (
                            <>
                              <select
                                className="input"
                                defaultValue=""
                                onChange={(event) => {
                                  if (event.target.value) {
                                    void addTaskAssignee(task, Number(event.target.value));
                                    event.target.value = "";
                                  }
                                }}
                              >
                                <option value="">Add assignee...</option>
                                {members
                                  .filter(member => !task.assignees.some(a => a.id === member.user_id))
                                  .map((member) => (
                                    <option key={member.id} value={member.user_id}>
                                      {member.user_email ?? `USER ID ${member.user_id}`}
                                    </option>
                                  ))}
                              </select>
                              {task.assignees.length > 0 && (
                                <div className="assignees-list">
                                  {task.assignees.map(assignee => (
                                    <div key={assignee.id} className="assignee-tag">
                                      <span>{assignee.email}</span>
                                      <button 
                                        className="btn-remove-assignee"
                                        onClick={() => void removeTaskAssignee(task, assignee.id)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <button className="btn btn-danger" onClick={() => void deleteTaskDirectly(task.id)}>
                                Delete Task
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="task-panel">
                  <h3 className="section-title">Person-wise Completion</h3>
                  <div className="task-grid">
                    {memberProgress.map((row) => (
                      <div key={row.user_id} className="task-card">
                        <h4>{row.user_email ?? `User #${row.user_id}`}</h4>
                        <p className="task-status">
                          {row.completed_tasks}/{row.total_tasks} completed ({row.completion_percentage}%)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p className="empty-title">No workspace selected</p>
                <p className="empty-subtitle">Click a workspace from the list to manage members and tasks.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Your Assigned Tasks</h3>
              <button className="btn-close" onClick={() => setShowNotifications(false)}>×</button>
            </div>
            <div className="modal-body">
              {assignedTasks.length === 0 ? (
                <p className="empty-subtitle">No tasks assigned to you</p>
              ) : (
                <div className="notifications-list">
                  {assignedTasks.map(task => (
                    <div 
                      key={task.id}
                      className="notification-item"
                      onClick={() => {
                        setSelectedNotificationTask(task);
                        setShowNotificationDetail(true);
                      }}
                    >
                      <h4>{task.title}</h4>
                      <p className="notification-meta">Status: {task.status}</p>
                      {task.due_date && (
                        <p className="notification-meta">Due: {new Date(task.due_date).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showNotificationDetail && selectedNotificationTask && (
        <div className="modal-overlay" onClick={() => setShowNotificationDetail(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedNotificationTask.title}</h3>
              <button className="btn-close" onClick={() => setShowNotificationDetail(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="notification-detail">
                <div className="detail-section">
                  <h4>Description</h4>
                  <p>{selectedNotificationTask.description || "No description"}</p>
                </div>
                <div className="detail-row">
                  <div>
                    <h4>Status</h4>
                    <p>{selectedNotificationTask.status}</p>
                  </div>
                  <div>
                    <h4>Priority</h4>
                    <p>{selectedNotificationTask.priority}</p>
                  </div>
                </div>
                {selectedNotificationTask.due_date && (
                  <div>
                    <h4>Due Date</h4>
                    <p>{new Date(selectedNotificationTask.due_date).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <h4>Assigned To</h4>
                  <p>{selectedNotificationTask.assignees.map(a => `${a.email} (ID: ${a.id})`).join(", ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
