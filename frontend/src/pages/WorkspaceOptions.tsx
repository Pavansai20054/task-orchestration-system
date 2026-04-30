import { useState } from "react";
import WorkspaceList from "../components/WorkspaceList";

export default function WorkspaceOptions() {
  const [action, setAction] = useState("add-member");

  return (
    <section className="card">
      <div className="card-header">
        <p className="card-kicker">Options</p>
        <h2 className="card-title">Workspace options</h2>
        <p className="card-subtitle">
          Choose an action for the selected workspace.
        </p>
      </div>

      <div className="workspace-form">
        <select
          className="input"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="add-member">Add member</option>
        </select>
      </div>

      <WorkspaceList showCreate={false} showMember={action === "add-member"} />
    </section>
  );
}
