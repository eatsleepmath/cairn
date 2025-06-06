// API service for Cairn Task Manager (using Next.js proxy)
const API_BASE_URL = '/api/cairn';

// API Response Types
export interface CairnActiveTask {
  task_id: string;
  payload: {
    run_id: string;
    created_at: string;
    updated_at: string;
    repos: string[];
    owner: string;
    description: string;
    subtask_ids: string[];
    agent_output: Record<string, any>;
    agent_status: string;
    agent_type: string;
    raw_logs_dump: Record<string, any>;
  };
  created_at: string;
  updated_at: string;
}

export interface CairnDebugMessage {
  message_id: number;
  message: string;
  timestamp: string;
}

export interface CairnTaskLog {
  log_id: number;
  run_id: string;
  agent_type: string;
  log_data: {
    run_id: string;
    last_updated: string;
    progress: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string | any[];
    }>;
  };
  created_at: string;
  updated_at: string;
}

// API Service Class
export class CairnApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetchWithErrorHandling<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error for ${url}:`, error);
      throw error;
    }
  }

  async getHealth(): Promise<{ status: string }> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/health`);
  }

  async getActiveTasks(): Promise<CairnActiveTask[]> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/active-tasks`);
  }

  async getDebugMessages(): Promise<CairnDebugMessage[]> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/debug-messages`);
  }

  async getTaskLogs(): Promise<CairnTaskLog[]> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/task-logs`);
  }

  async getTaskLogsByRunId(runId: string): Promise<CairnTaskLog[]> {
    return this.fetchWithErrorHandling(`${this.baseUrl}/task-logs/${runId}`);
  }

  // Combined data fetch for the dashboard
  async getDashboardData(): Promise<{
    activeTasks: CairnActiveTask[];
    debugMessages: CairnDebugMessage[];
    taskLogs: CairnTaskLog[];
  }> {
    try {
      const [activeTasks, debugMessages, taskLogs] = await Promise.all([
        this.getActiveTasks(),
        this.getDebugMessages(),
        this.getTaskLogs(),
      ]);

      return {
        activeTasks,
        debugMessages,
        taskLogs,
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

// Default API service instance
export const cairnApi = new CairnApiService(); 