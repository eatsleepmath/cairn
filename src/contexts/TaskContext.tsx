import { cairnApi } from "@/lib/api";
import { transformCairnDataToHierarchy } from "@/lib/data-transform";
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
  // Additional API data for debugging/monitoring
  debugMessages: any[];
  apiHealth: { status: string } | null;
}

type TaskState = {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  autoRefreshEnabled: boolean;
  debugMessages: any[];
  apiHealth: { status: string } | null;
};

type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'MERGE_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_AUTO_REFRESH'; payload: boolean }
  | { type: 'SET_DEBUG_MESSAGES'; payload: any[] }
  | { type: 'SET_API_HEALTH'; payload: { status: string } | null };

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
    case 'SET_DEBUG_MESSAGES':
      return { ...state, debugMessages: action.payload };
    case 'SET_API_HEALTH':
      return { ...state, apiHealth: action.payload };
    default:
      return state;
  }
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialState: TaskState = {
    tasks: [],
    isLoading: false,
    error: null,
    autoRefreshEnabled: false,
    debugMessages: [],
    apiHealth: null,
  };

  const [state, dispatch] = useReducer(taskReducer, initialState);
  const isInitialFetch = useRef(true);
  const lastRefreshTime = useRef<number>(0);

  // Real API fetch function
  const fetchTasks = useCallback(async (isManualRefresh: boolean = false) => {
    if (isManualRefresh || isInitialFetch.current) {
      dispatch({ type: 'SET_LOADING', payload: true });
    }

    try {
      console.log('Fetching data from Cairn API...');
      
      // Fetch data from the real Cairn API
      const dashboardData = await cairnApi.getDashboardData();
      
      console.log('API Response:', {
        activeTasks: dashboardData.activeTasks.length,
        taskLogs: dashboardData.taskLogs.length,
        debugMessages: dashboardData.debugMessages.length,
      });

      // Transform the API data to our Task structure
      const transformedTasks = transformCairnDataToHierarchy(
        dashboardData.activeTasks,
        dashboardData.taskLogs
      );

      console.log('Transformed tasks:', transformedTasks.length);

      if (isInitialFetch.current) {
        dispatch({ type: 'SET_TASKS', payload: transformedTasks });
        isInitialFetch.current = false;
      } else {
        dispatch({ type: 'MERGE_TASKS', payload: transformedTasks });
      }

      // Store debug messages and health info
      dispatch({ type: 'SET_DEBUG_MESSAGES', payload: dashboardData.debugMessages });
      
      // Check API health
      try {
        const health = await cairnApi.getHealth();
        dispatch({ type: 'SET_API_HEALTH', payload: health });
      } catch (healthError) {
        console.warn('Health check failed:', healthError);
        dispatch({ type: 'SET_API_HEALTH', payload: null });
      }

      dispatch({ type: 'SET_ERROR', payload: null });
      lastRefreshTime.current = Date.now();
      
      console.log('Successfully updated tasks from Cairn API');
      
    } catch (err) {
      console.error('Error fetching from Cairn API:', err);
      
      const error = err instanceof Error ? err : new Error('Failed to fetch tasks from Cairn API');
      dispatch({ type: 'SET_ERROR', payload: error });
      
      // If this is the initial fetch and we get an error, set some fallback empty state
      if (isInitialFetch.current) {
        dispatch({ type: 'SET_TASKS', payload: [] });
        isInitialFetch.current = false;
      }
    } finally {
      if (isManualRefresh || isInitialFetch.current) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    console.log('Manual refresh triggered');
    await fetchTasks(true);
  }, [fetchTasks]);

  const addTask = useCallback((task: Task) => {
    // Note: For real implementation, you'd want to make an API call to create a new task
    console.warn('addTask called but Cairn API doesn\'t have a create task endpoint yet');
    dispatch({ type: 'ADD_TASK', payload: task });
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    // Note: For real implementation, you'd want to make an API call to update the task
    console.warn('updateTask called but Cairn API doesn\'t have an update task endpoint yet');
    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates } });
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    // Note: For real implementation, you'd want to make an API call to update the task status
    console.warn('updateTaskStatus called but Cairn API doesn\'t have an update status endpoint yet');
    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: { status } } });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    // Note: For real implementation, you'd want to make an API call to delete the task
    console.warn('deleteTask called but Cairn API doesn\'t have a delete task endpoint yet');
    dispatch({ type: 'DELETE_TASK', payload: taskId });
  }, []);

  const setAutoRefreshEnabled = useCallback((enabled: boolean) => {
    console.log('Auto-refresh', enabled ? 'enabled' : 'disabled');
    dispatch({ type: 'SET_AUTO_REFRESH', payload: enabled });
  }, []);

  // Initial fetch
  useEffect(() => {
    console.log('TaskProvider: Initial fetch starting...');
    fetchTasks(true);
  }, [fetchTasks]);

  // Auto-refresh with throttling
  useEffect(() => {
    if (!state.autoRefreshEnabled) return;

    console.log('Setting up auto-refresh interval');
    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastRefreshTime.current >= 5000) { // 5 second throttle
        console.log('Auto-refresh triggered');
        fetchTasks(false);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      console.log('Clearing auto-refresh interval');
      clearInterval(intervalId);
    };
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
        debugMessages: state.debugMessages,
        apiHealth: state.apiHealth,
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