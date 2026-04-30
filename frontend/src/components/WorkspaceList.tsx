import { useEffect, useState } from "react";
import API from "../api/api";

type WorkspaceListProps = {
  onSelect?: (id: number) => void;
  showCreate?: boolean;
  showMember?: boolean;
};

export default function WorkspaceList({
  onSelect,
  showCreate = true,
  showMember = true,
}: WorkspaceListProps) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    const res = await API.get("/workspaces/");
    setWorkspaces(res.data);
    if (res.data.length > 0 && !activeId) {
      setActiveId(res.data[0].id);
      onSelect?.(res.data[0].id);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      setError("Workspace name is required");
      return;
    }

    setError(null);
    const res = await API.post("/workspaces/", { name: newWorkspaceName });
    setNewWorkspaceName("");
    await fetchWorkspaces();
    setActiveId(res.data.id);
    onSelect?.(res.data.id);
  };

  const addMember = async () => {
    if (!activeId) {
      setError("Select a workspace first");
      return;
    }

    if (!memberUserId.trim()) {
      setError("User ID is required");
      return;
    }

    const parsedUserId = Number(memberUserId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      setError("User ID must be a positive number");
      return;
    }

    setError(null);
    await API.post(`/workspaces/${activeId}/members`, null, {
      params: {
        user_id: parsedUserId,
        role: memberRole,
      },
    });
    setMemberUserId("");
  };

  return (
    <div className="workspace-panel">
      <h3 className="section-title">Workspaces</h3>
      <div className="workspace-list">
        {workspaces.map((ws: any) => (
          <button
            key={ws.id}
            className={`workspace-pill ${activeId === ws.id ? "active" : ""}`}
            onClick={() => {
              setActiveId(ws.id);
              onSelect?.(ws.id);
            }}
          >
            <span className="workspace-name">{ws.name}</span>
            <span className="workspace-meta">Open</span>
          </button>
        ))}
      </div>

      {showCreate ? (
        <div className="workspace-form">
          <input
            className="input"
            placeholder="New workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={createWorkspace}>
            Create
          </button>
        </div>
      ) : null}

      {showMember ? (
        <div className="workspace-form">
          <input
            className="input"
            placeholder="Member user id"
            value={memberUserId}
            onChange={(e) => setMemberUserId(e.target.value)}
          />
          <select
            className="input"
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn btn-ghost" onClick={addMember}>
            Add member
          </button>
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
