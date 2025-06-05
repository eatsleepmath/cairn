import { TaskStatus } from './index';

export type AgentType = 'Fullstack' | 'PM' | 'SWE' | 'Trace';

export interface TraceStep {
  id: string;
  timestamp: string;
  type: 'tool_call' | 'tool_output' | 'thought' | 'decision' | 'error';
  content: string;
  metadata?: Record<string, any>;
  duration?: number;
  status?: 'success' | 'error' | 'pending';
  tool_name?: string;
  input?: any;
  output?: any;
}

export interface AgentNode {
  id: string;
  title: string;
  agentType: AgentType;
  status: TaskStatus;
  progress?: number;
  assignees?: string[];
  priority?: string;
  due_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  
  // Hierarchical navigation
  parentId?: string;
  children?: AgentNode[];
  level: number; // 1=Task, 2=Subtask, 3=Engineering, 4=Trace
  
  // Agent-specific data
  traceSteps?: TraceStep[];
  agent_output?: {
    pr_url?: string;
    branch?: string;
    recommendations?: string[];
    issues_encountered?: string[];
  };
  run_ids?: string[];
  
  // Animation and UI states
  isAnimating?: boolean;
  isExpanded?: boolean;
  hasActiveAgent?: boolean;
}

export interface NavigationState {
  currentLevel: number;
  currentParentId?: string;
  breadcrumbs: {
    id: string;
    title: string;
    level: number;
  }[];
  selectedNodeId?: string;
}

export interface ZoomTransition {
  from: { level: number; parentId?: string };
  to: { level: number; parentId?: string };
  direction: 'zoom-in' | 'zoom-out';
} 