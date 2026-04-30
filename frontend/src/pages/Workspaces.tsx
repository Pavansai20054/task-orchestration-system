import WorkspaceList from "../components/WorkspaceList";

export default function Workspaces() {
  return (
    <section className="card">
      <div className="card-header">
        <p className="card-kicker">Workspaces</p>
        <h2 className="card-title">Your workspaces</h2>
        <p className="card-subtitle">
          Select a workspace to continue to tasks.
        </p>
      </div>

      <WorkspaceList showCreate={false} showMember={false} />
    </section>
  );
}
