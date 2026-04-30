import { useState } from "react";
import API from "../api/api";

export default function CreateTask({ workspaceId, onCreated }: any) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createTask = async () => {
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    const allowedStatus = ["todo", "in_progress", "done"];
    const allowedPriority = ["low", "medium", "high"];

    if (!allowedStatus.includes(status)) {
      setError("Invalid status selected");
      return;
    }

    if (!allowedPriority.includes(priority)) {
      setError("Invalid priority selected");
      return;
    }

    if (dueDate) {
      const due = new Date(dueDate);
      if (Number.isNaN(due.getTime())) {
        setError("Invalid due date");
        return;
      }
      if (due.getTime() < Date.now()) {
        setError("Due date cannot be in the past");
        return;
      }
    }

    setError(null);
    await API.post("/tasks/", {
      title,
      description: "",
      status,
      priority,
      workspace_id: workspaceId,
      assigned_to: null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });

    setTitle("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    onCreated();
  };

  return (
    <div className="create-panel">
      <div>
        <p className="section-kicker">Create task</p>
        <h4 className="section-title">Add a new task</h4>
      </div>
      <div className="create-form">
        <input
          className="input"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          className="input"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          className="input"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={createTask}>
          Add
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
