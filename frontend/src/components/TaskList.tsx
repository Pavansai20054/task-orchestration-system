import { useState } from "react";

type TaskListProps = {
  tasks: any[];
  onUpdate: (taskId: number, patch: any) => void;
};

export default function TaskList({ tasks, onUpdate }: TaskListProps) {
  const [drafts, setDrafts] = useState<Record<number, any>>({});
  const [error, setError] = useState<string | null>(null);

  const updateDraft = (taskId: number, changes: any) => {
    setDrafts((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...changes,
      },
    }));
  };

  const submitUpdate = (task: any) => {
    const patch = drafts[task.id];
    if (!patch) {
      setError("No changes to update");
      return;
    }
    const allowedStatus = ["todo", "in_progress", "done"];
    const allowedPriority = ["low", "medium", "high"];

    if (patch.status && !allowedStatus.includes(patch.status)) {
      setError("Invalid status value");
      return;
    }

    if (patch.priority && !allowedPriority.includes(patch.priority)) {
      setError("Invalid priority value");
      return;
    }

    setError(null);
    onUpdate(task.id, patch);
    setDrafts((prev) => {
      const newDrafts = { ...prev };
      delete newDrafts[task.id];
      return newDrafts;
    });
  };

  return (
    <div className="task-panel">
      <h3 className="section-title">Tasks</h3>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="task-grid">
        {tasks.map((task: any) => (
          <div key={task.id} className="task-card">
            <div className="task-card-header">
              <h4>{task.title}</h4>
              <span className={`chip chip-${task.priority}`}>
                {task.priority}
              </span>
            </div>
            <p className="task-status">Status: {task.status}</p>
            <div className="task-actions">
              <select
                className="input"
                value={drafts[task.id]?.status ?? task.status}
                onChange={(e) =>
                  updateDraft(task.id, { status: e.target.value })
                }
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                className="input"
                value={drafts[task.id]?.priority ?? task.priority}
                onChange={(e) =>
                  updateDraft(task.id, { priority: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                className="btn btn-ghost"
                onClick={() => submitUpdate(task)}
              >
                Update
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
