export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low' | 'No Priority';

export type TaskStatus =
  | 'Todo'
  | 'Backlog'
  | 'In Progress'
  | 'Testing'
  | 'Done'
  | 'Completed'
  | 'Agent Done: Review'
  | 'Agent Failed'
  | 'Agent Working';

export interface Subtask {
  id: string;
  title: string;
  status: string;
  task: string;
  llm_description?: string;
  assigned_to_agent?: boolean;
  run_ids?: string[];
  agent_output?: {
    branch: string;
    pr_url: string;
    recommendations: string[];
    issues_encountered: string[];
    pull_request_message: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: Priority;
  due_date?: string;
  created_at: string;
  updated_at: string;
  assignees: string[];
  tags?: string[];
  projects?: string[];
  subtasks?: Task[];
  created_by: string;
  team: string;
  link?: string;
  explore_queued_at?: string;
  explore_done_at?: string;
  explore_result?: any;
  repos?: string[];
  jobs?: string[];
  createdAt?: string;
  updatedAt?: string;
  assignee?: string;
  dueDate?: string;
  topic?: string;
  project?: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: string;
  dueDate?: Date | string;
  topic?: string;
  project?: string;
}

export interface FilterOptions {
  status?: TaskStatus | 'all';
  assignee?: string | 'all';
  topic?: string | 'all';
  project?: string | 'all';
  searchQuery?: string;
  sortBy?: 'created_at' | 'updated_at' | 'due_date' | 'title' | 'status' | 'assignee';
  sortOrder?: 'asc' | 'desc';
}

export interface TeamUser {
  uid: string;
  first_name: string;
  last_name: string;
  account_email_address: string;
  team_ids: string[];
  role?: string;
  avatar?: string;
} 