import { Task } from "@/types";
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from "react";

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  deleteTask: (taskId: string) => void;
  isLoading: boolean;
  error: Error | null;
  refreshTasks: () => Promise<void>;
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
}

type TaskState = {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  autoRefreshEnabled: boolean;
};

type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'MERGE_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_AUTO_REFRESH'; payload: boolean };

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'MERGE_TASKS': {
      const existingTasksMap = new Map(state.tasks.map(task => [task.id, task]));
      action.payload.forEach((newTask: Task) => {
        existingTasksMap.set(newTask.id, newTask);
      });
      const mergedTasks = Array.from(existingTasksMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { ...state, tasks: mergedTasks };
    }
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_AUTO_REFRESH':
      return { ...state, autoRefreshEnabled: action.payload };
    default:
      return state;
  }
};

// Mock data for demonstration
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Build User Authentication System',
    description: 'Implement a comprehensive user authentication system with JWT tokens, password reset functionality, and OAuth integration.',
    status: 'In Progress',
    priority: 'High',
    due_date: '2024-12-20',
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-05T14:30:00Z',
    assignees: ['agent-fullstack', 'john.doe'],
    created_by: 'john.doe',
    team: 'frontend',
    subtasks: [
      {
        id: 'subtask-1-1',
        title: 'Design Authentication Flow',
        description: 'Create wireframes and user flow for the authentication process',
        status: 'Completed',
        priority: 'High',
        created_at: '2024-12-01T10:30:00Z',
        updated_at: '2024-12-02T16:00:00Z',
        assignees: ['pm-agent'],
        created_by: 'john.doe',
        team: 'frontend',
        subtasks: [
          {
            id: 'engineering-1-1-1',
            title: 'User Story Analysis',
            description: 'Analyze user requirements and create detailed specifications',
            status: 'Completed',
            created_at: '2024-12-01T11:00:00Z',
            updated_at: '2024-12-02T12:00:00Z',
            assignees: ['swe-agent-1'],
            created_by: 'pm-agent',
            team: 'frontend',
          }
        ]
      },
      {
        id: 'subtask-1-2',
        title: 'Backend API Development',
        description: 'Develop REST APIs for user registration, login, and token management',
        status: 'Agent Working',
        priority: 'High',
        created_at: '2024-12-02T09:00:00Z',
        updated_at: '2024-12-05T14:30:00Z',
        assignees: ['swe-agent-2'],
        created_by: 'john.doe',
        team: 'frontend',
      }
    ]
  },
  {
    id: 'task-2',
    title: 'Implement Real-time Dashboard',
    description: 'Create a real-time dashboard showing system metrics and user activity with WebSocket connections.',
    status: 'Testing',
    priority: 'Medium',
    due_date: '2024-12-25',
    created_at: '2024-11-28T09:00:00Z',
    updated_at: '2024-12-04T11:00:00Z',
    assignees: ['agent-fullstack', 'jane.smith'],
    created_by: 'jane.smith',
    team: 'frontend',
    subtasks: [
      {
        id: 'subtask-2-1',
        title: 'WebSocket Integration',
        description: 'Set up WebSocket connection for real-time data updates',
        status: 'Completed',
        priority: 'High',
        created_at: '2024-11-28T10:00:00Z',
        updated_at: '2024-12-01T15:00:00Z',
        assignees: ['swe-agent-3'],
        created_by: 'jane.smith',
        team: 'frontend',
      },
      {
        id: 'subtask-2-2',
        title: 'Dashboard UI Components',
        description: 'Create reusable chart and metric components',
        status: 'Testing',
        priority: 'Medium',
        created_at: '2024-11-29T14:00:00Z',
        updated_at: '2024-12-04T11:00:00Z',
        assignees: ['swe-agent-4'],
        created_by: 'jane.smith',
        team: 'frontend',
      }
    ]
  },
  {
    id: 'task-3',
    title: 'Database Optimization',
    description: 'Optimize database queries and implement caching strategies to improve application performance.',
    status: 'Todo',
    priority: 'Medium',
    due_date: '2025-01-15',
    created_at: '2024-12-03T08:00:00Z',
    updated_at: '2024-12-03T08:00:00Z',
    assignees: ['backend-team'],
    created_by: 'admin',
    team: 'backend',
  },
  {
    id: 'task-4',
    title: 'Mobile App Development',
    description: 'Develop a mobile companion app with offline capabilities and push notifications.',
    status: 'Agent Done: Review',
    priority: 'Low',
    due_date: '2025-02-01',
    created_at: '2024-11-15T12:00:00Z',
    updated_at: '2024-12-01T09:00:00Z',
    assignees: ['mobile-agent', 'alex.johnson'],
    created_by: 'alex.johnson',
    team: 'mobile',
  }
];

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialState: TaskState = {
    tasks: [],
    isLoading: false,
    error: null,
    autoRefreshEnabled: false,
  };

  const [state, dispatch] = useReducer(taskReducer, initialState);
  const isInitialFetch = useRef(true);
  const lastRefreshTime = useRef<number>(0);

  // Mock fetch function with simulated delay
  const fetchTasks = useCallback(async (isManualRefresh: boolean = false) => {
    if (isManualRefresh || isInitialFetch.current) {
      dispatch({ type: 'SET_LOADING', payload: true });
    }

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isInitialFetch.current) {
        dispatch({ type: 'SET_TASKS', payload: mockTasks });
        isInitialFetch.current = false;
      } else {
        // Simulate some status changes during auto-refresh
        const updatedTasks = mockTasks.map(task => {
          if (task.status === 'Agent Working' && Math.random() > 0.7) {
            return { ...task, status: 'Agent Done: Review' as const, updated_at: new Date().toISOString() };
          }
          if (task.status === 'In Progress' && Math.random() > 0.8) {
            return { ...task, status: 'Testing' as const, updated_at: new Date().toISOString() };
          }
          return task;
        });
        dispatch({ type: 'MERGE_TASKS', payload: updatedTasks });
      }

      dispatch({ type: 'SET_ERROR', payload: null });
      lastRefreshTime.current = Date.now();
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err : new Error('Failed to fetch tasks')
      });
    } finally {
      if (isManualRefresh || isInitialFetch.current) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    await fetchTasks(true);
  }, [fetchTasks]);

  const addTask = useCallback((task: Task) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates } });
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: { status } } });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
  }, []);

  const setAutoRefreshEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_AUTO_REFRESH', payload: enabled });
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  // Auto-refresh with throttling
  useEffect(() => {
    if (!state.autoRefreshEnabled) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastRefreshTime.current >= 5000) {
        fetchTasks(false);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [state.autoRefreshEnabled, fetchTasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks: state.tasks,
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        isLoading: state.isLoading,
        error: state.error,
        refreshTasks,
        autoRefreshEnabled: state.autoRefreshEnabled,
        setAutoRefreshEnabled,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}; 