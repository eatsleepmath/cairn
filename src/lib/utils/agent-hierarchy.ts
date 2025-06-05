import { Task } from '@/types';
import { AgentNode, AgentType, NavigationState, TraceStep } from '@/types/agent-hierarchy';

// Determine agent type based on task level and assignees
export function determineAgentType(task: Task, level: number): AgentType {
  if (level === 4) return 'Trace';
  
  // Check assignees for agent types
  const assigneeStr = task.assignees?.join(' ').toLowerCase() || '';
  
  if (level === 1) return 'Fullstack';
  if (level === 2) return 'PM';
  if (level === 3) return 'SWE';
  
  // Fallback based on assignee keywords
  if (assigneeStr.includes('fullstack') || assigneeStr.includes('full-stack')) return 'Fullstack';
  if (assigneeStr.includes('pm') || assigneeStr.includes('product') || assigneeStr.includes('manager')) return 'PM';
  if (assigneeStr.includes('swe') || assigneeStr.includes('engineer') || assigneeStr.includes('developer')) return 'SWE';
  
  return level === 1 ? 'Fullstack' : level === 2 ? 'PM' : 'SWE';
}

// Transform a task into hierarchical agent nodes
export function taskToAgentHierarchy(task: Task, level: number = 1, parentId?: string): AgentNode[] {
  const nodes: AgentNode[] = [];
  
  // Create the main task node
  const mainNode: AgentNode = {
    id: task.id,
    title: task.title,
    agentType: determineAgentType(task, level),
    status: task.status,
    progress: calculateProgress(task),
    assignees: task.assignees,
    priority: task.priority,
    due_date: task.due_date,
    description: task.description,
    created_at: task.created_at,
    updated_at: task.updated_at,
    parentId,
    level,
    children: [],
    isAnimating: task.status === 'In Progress' || task.status === 'Agent Working',
    hasActiveAgent: task.assignees?.some(a => a.toLowerCase().includes('agent')) || false,
    run_ids: (task as any).run_ids,
    agent_output: (task as any).agent_output,
  };

  // Add subtasks as children if they exist
  if (task.subtasks && task.subtasks.length > 0) {
    task.subtasks.forEach(subtask => {
      const childNodes = taskToAgentHierarchy(subtask, level + 1, task.id);
      mainNode.children!.push(...childNodes);
    });
  }

  // For SWE level (level 3), generate engineering tasks
  if (level === 3 && !task.subtasks?.length) {
    const engineeringTasks = generateEngineeringTasks(task);
    mainNode.children!.push(...engineeringTasks);
  }

  nodes.push(mainNode);
  return nodes;
}

// Generate mock engineering tasks for SWE agents
function generateEngineeringTasks(task: Task): AgentNode[] {
  const engineeringTasks: AgentNode[] = [
    {
      id: `${task.id}-analysis`,
      title: 'Code Analysis & Planning',
      agentType: 'SWE',
      status: 'Completed',
      level: 4,
      parentId: task.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: 100,
      traceSteps: generateMockTraceSteps('analysis'),
    },
    {
      id: `${task.id}-implementation`,
      title: 'Implementation',
      agentType: 'SWE',
      status: task.status === 'In Progress' ? 'In Progress' : 'Completed',
      level: 4,
      parentId: task.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: task.status === 'In Progress' ? 60 : 100,
      isAnimating: task.status === 'In Progress',
      traceSteps: generateMockTraceSteps('implementation'),
    },
    {
      id: `${task.id}-testing`,
      title: 'Testing & Validation',
      agentType: 'SWE',
      status: task.status === 'Testing' ? 'In Progress' : task.status === 'Completed' ? 'Completed' : 'Todo',
      level: 4,
      parentId: task.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: task.status === 'Testing' ? 80 : task.status === 'Completed' ? 100 : 0,
      traceSteps: generateMockTraceSteps('testing'),
    },
  ];

  return engineeringTasks;
}

// Generate mock trace steps for demonstration
function generateMockTraceSteps(phase: string): TraceStep[] {
  const baseTime = Date.now();
  
  const steps: TraceStep[] = [
    {
      id: `trace-${phase}-1`,
      timestamp: new Date(baseTime - 300000).toISOString(),
      type: 'thought',
      content: `Starting ${phase} phase. Analyzing requirements and planning approach.`,
      status: 'success',
    },
    {
      id: `trace-${phase}-2`,
      timestamp: new Date(baseTime - 240000).toISOString(),
      type: 'tool_call',
      content: 'file_search',
      tool_name: 'file_search',
      input: { query: 'relevant files', path: './src' },
      status: 'success',
    },
    {
      id: `trace-${phase}-3`,
      timestamp: new Date(baseTime - 180000).toISOString(),
      type: 'tool_output',
      content: 'Found 5 relevant files to modify',
      status: 'success',
    },
    {
      id: `trace-${phase}-4`,
      timestamp: new Date(baseTime - 120000).toISOString(),
      type: 'decision',
      content: `Based on analysis, proceeding with ${phase} implementation.`,
      status: 'success',
    },
  ];

  if (phase === 'implementation') {
    steps.push(
      {
        id: `trace-${phase}-5`,
        timestamp: new Date(baseTime - 60000).toISOString(),
        type: 'tool_call',
        content: 'edit_file',
        tool_name: 'edit_file',
        input: { file: 'src/components/main.tsx', changes: 'Adding new functionality' },
        status: 'success',
      },
      {
        id: `trace-${phase}-6`,
        timestamp: new Date(baseTime - 30000).toISOString(),
        type: 'tool_output',
        content: 'File successfully modified',
        status: 'success',
      }
    );
  }

  return steps;
}

// Calculate progress based on task status
function calculateProgress(task: Task): number {
  switch (task.status) {
    case 'Completed':
    case 'Done':
      return 100;
    case 'Testing':
    case 'Agent Done: Review':
      return 80;
    case 'In Progress':
    case 'Agent Working':
      return 50;
    case 'Todo':
    case 'Backlog':
      return 0;
    default:
      return 0;
  }
}

// Get children nodes for a specific parent at the current navigation level
export function getChildrenForNavigation(
  allNodes: AgentNode[],
  parentId: string | undefined,
  targetLevel: number
): AgentNode[] {
  if (!parentId) {
    // Return top-level tasks (level 1)
    return allNodes.filter(node => node.level === 1);
  }

  const parent = findNodeById(allNodes, parentId);
  if (!parent || !parent.children) return [];

  return parent.children.filter(node => node.level === targetLevel);
}

// Find a node by ID in the hierarchy
export function findNodeById(nodes: AgentNode[], id: string): AgentNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

// Update navigation state when zooming in/out
export function updateNavigationState(
  currentState: NavigationState,
  targetNodeId: string,
  allNodes: AgentNode[],
  direction: 'zoom-in' | 'zoom-out'
): NavigationState {
  const targetNode = findNodeById(allNodes, targetNodeId);
  if (!targetNode) return currentState;

  if (direction === 'zoom-in') {
    // Zooming into a node to see its children
    const newBreadcrumbs = [
      ...currentState.breadcrumbs,
      {
        id: targetNode.id,
        title: targetNode.title,
        level: targetNode.level,
      }
    ];

    return {
      currentLevel: targetNode.level + 1,
      currentParentId: targetNode.id,
      breadcrumbs: newBreadcrumbs,
      selectedNodeId: undefined,
    };
  } else {
    // Zooming out to parent level
    const newBreadcrumbs = currentState.breadcrumbs.slice(0, -1);
    const parentBreadcrumb = newBreadcrumbs[newBreadcrumbs.length - 1];

    return {
      currentLevel: parentBreadcrumb ? parentBreadcrumb.level + 1 : 1,
      currentParentId: parentBreadcrumb?.id,
      breadcrumbs: newBreadcrumbs,
      selectedNodeId: undefined,
    };
  }
}

// Get agent icon based on type
export function getAgentIcon(agentType: AgentType): string {
  switch (agentType) {
    case 'Fullstack':
      return '🔧';
    case 'PM':
      return '📋';
    case 'SWE':
      return '⚡';
    case 'Trace':
      return '🔍';
    default:
      return '🤖';
  }
}

// Get agent color theme
export function getAgentColor(agentType: AgentType): {
  bg: string;
  border: string;
  text: string;
} {
  switch (agentType) {
    case 'Fullstack':
      return {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/50',
        text: 'text-purple-400',
      };
    case 'PM':
      return {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
      };
    case 'SWE':
      return {
        bg: 'bg-green-500/20',
        border: 'border-green-500/50',
        text: 'text-green-400',
      };
    case 'Trace':
      return {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/50',
        text: 'text-orange-400',
      };
    default:
      return {
        bg: 'bg-gray-500/20',
        border: 'border-gray-500/50',
        text: 'text-gray-400',
      };
  }
} 