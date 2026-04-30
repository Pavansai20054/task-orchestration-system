import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import WorkspaceList from "../components/WorkspaceList";
import TaskList from "../components/TaskList";
import CreateTask from "../components/CreateTask";

type CurrentUser = {
  id: number;
  email: string;
} | null;

type DashboardProps = {
  currentUser: CurrentUser;
};

export default function Dashboard({ currentUser }: DashboardProps) {
  const [tasks, setTasks] = useState([]);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  const fetchTasks = async () => {
    const res = await API.get("/tasks/");
    setTasks(res.data);
  };

  const updateTask = async (taskId: number, patch: any) => {
    await API.put(`/tasks/${taskId}`, patch);
    await fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <p className="card-kicker">Dashboard</p>
        <h2 className="card-title">Workspace flow</h2>
        <p className="card-subtitle">
          {currentUser
            ? `Welcome, ${currentUser.email}. Select a workspace to continue.`
            : "Choose a workspace to manage tasks and track progress."}
        </p>
      </div>

      <div className="dashboard-actions">
        <Link className="action-link" to="/workspaces">
          Check workspaces
        </Link>
        <Link className="action-link" to="/workspaces/create">
          Create workspace
        </Link>
        <Link className="action-link" to="/workspaces/options">
          Workspace options
        </Link>
      </div>

      <div className="dashboard-grid">
        <WorkspaceList
          onSelect={setWorkspaceId}
          showCreate={false}
          showMember={false}
        />

        <div className="dashboard-panel">
          {workspaceId ? (
            <>
              <CreateTask workspaceId={workspaceId} onCreated={fetchTasks} />
              <TaskList
                tasks={tasks.filter((t: any) => t.workspace_id === workspaceId)}
                onUpdate={updateTask}
              />
            </>
          ) : (
            <div className="empty-state">
              <p className="empty-title">No workspace selected</p>
              <p className="empty-subtitle">
                Pick a workspace to see tasks and create new ones.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
