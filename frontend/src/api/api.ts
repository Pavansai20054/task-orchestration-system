import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const setAuthToken = (token: string) => {
  API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  delete API.defaults.headers.common["Authorization"];
};

export type User = {
  id: number;
  email: string;
  created_at: string;
};

export type Workspace = {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  current_user_role: "admin" | "member" | null;
};

export type WorkspaceMember = {
  id: number;
  user_id: number;
  workspace_id: number;
  role: "admin" | "member";
  user_email?: string | null;
};

export type MemberProgress = {
  user_id: number;
  user_email?: string | null;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
};

export type AssigneeInfo = {
  id: number;
  email: string;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  workspace_id: number;
  created_by: number;
  assignees: AssigneeInfo[];
  created_at: string;
};

export type DashboardData = {
  stats: {
    total_tasks: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
    completion_percentage: number;
  };
  overdue_tasks: Task[];
};

export default API;
