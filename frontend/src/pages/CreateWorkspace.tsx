import WorkspaceList from "../components/WorkspaceList";

export default function CreateWorkspace() {
  return (
    <section className="card">
      <div className="card-header">
        <p className="card-kicker">Create</p>
        <h2 className="card-title">Create a workspace</h2>
        <p className="card-subtitle">
          Give your workspace a clear, memorable name.
        </p>
      </div>

      <WorkspaceList showCreate showMember={false} />
    </section>
  );
}
