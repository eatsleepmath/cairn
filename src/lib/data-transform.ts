import { Task, TaskStatus } from '@/types';
import { AgentNode, TraceStep } from '@/types/agent-hierarchy';
import { CairnActiveTask, CairnTaskLog } from './api';

// Map Cairn agent status to our TaskStatus
export function mapAgentStatusToTaskStatus(agentStatus: string): TaskStatus {
  const statusMap: Record<string, TaskStatus> = {
    'Failed': 'Agent Failed',
    'Working': 'Agent Working', 
    'Completed': 'Agent Done: Review',
    'In Progress': 'In Progress',
    'Done': 'Done',
    'Testing': 'Testing',
    'Todo': 'Todo',
    'Backlog': 'Backlog',
  };

  return statusMap[agentStatus] || 'Todo';
}

// Map Cairn agent type to our agent hierarchy level and type
export function mapAgentTypeToLevel(agentType: string): { level: number; type: string } {
  const typeMap: Record<string, { level: number; type: string }> = {
    'Fullstack Planner': { level: 1, type: 'Fullstack' },
    'PM': { level: 2, type: 'PM' },
    'SWE': { level: 3, type: 'SWE' },
    'agent_logger': { level: 4, type: 'Trace' },
  };

  return typeMap[agentType] || { level: 1, type: 'Fullstack' };
}

// Transform log data into trace steps
export function transformLogDataToTraceSteps(taskLog: CairnTaskLog): TraceStep[] {
  const steps: TraceStep[] = [];
  
  if (taskLog.log_data.progress) {
    taskLog.log_data.progress.forEach((entry, index) => {
      // Skip system messages as they're usually prompts
      if (entry.role === 'system') return;
      
      const baseTime = new Date(taskLog.created_at).getTime();
      const stepTime = new Date(baseTime + (index * 30000)); // Space out by 30 seconds
      
      let stepType: TraceStep['type'];
      let content: string;
      
      if (entry.role === 'user') {
        stepType = 'thought';
        content = typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content);
      } else {
        // Assistant response - try to determine type from content
        const contentStr = typeof entry.content === 'string' 
          ? entry.content 
          : Array.isArray(entry.content) 
            ? entry.content.map(c => typeof c === 'string' ? c : c.text || JSON.stringify(c)).join(' ')
            : JSON.stringify(entry.content);
            
        if (contentStr.includes('<analysis>')) {
          stepType = 'thought';
          content = contentStr.replace(/<\/?analysis>/g, '').trim();
        } else if (contentStr.includes('tool_call') || contentStr.includes('function_calls')) {
          stepType = 'tool_call';
          content = contentStr;
        } else if (contentStr.includes('error') || contentStr.includes('Error')) {
          stepType = 'error';
          content = contentStr;
        } else {
          stepType = 'decision';
          content = contentStr;
        }
      }
      
      steps.push({
        id: `trace-${taskLog.run_id}-${index}`,
        timestamp: stepTime.toISOString(),
        type: stepType,
        content: content.substring(0, 500), // Limit content length
        status: 'success',
        metadata: {
          role: entry.role,
          originalIndex: index,
        },
      });
    });
  }
  
  return steps;
}

// Transform a Cairn active task to our Task structure
export function transformCairnTaskToTask(cairnTask: CairnActiveTask): Task {
  const payload = cairnTask.payload;
  const status = mapAgentStatusToTaskStatus(payload.agent_status);
  
  return {
    id: cairnTask.task_id,
    title: payload.description || 'Untitled Task',
    description: payload.description,
    status,
    priority: 'Medium', // Default priority since API doesn't provide this
    created_at: payload.created_at,
    updated_at: payload.updated_at,
    assignees: [payload.agent_type],
    created_by: payload.owner,
    team: payload.repos.join(', '),
    repos: payload.repos,
    // Add run_id and agent_output for the visualization
    run_ids: [payload.run_id],
    agent_output: payload.agent_output,
  };
}

// Transform tasks with associated logs into a hierarchical structure
export function transformCairnDataToHierarchy(
  cairnTasks: CairnActiveTask[],
  taskLogs: CairnTaskLog[]
): Task[] {
  const tasks: Task[] = [];
  
  cairnTasks.forEach(cairnTask => {
    const task = transformCairnTaskToTask(cairnTask);
    
    // Find associated logs for this task
    const associatedLogs = taskLogs.filter(log => log.run_id === cairnTask.payload.run_id);
    
    // Create subtasks from logs if any exist
    if (associatedLogs.length > 0) {
      task.subtasks = associatedLogs.map(log => {
        const agentTypeInfo = mapAgentTypeToLevel(log.agent_type);
        
        return {
          id: `${task.id}-${log.log_id}`,
          title: `${log.agent_type} Execution`,
          description: `Execution log for ${log.agent_type}`,
          status: task.status, // Inherit status from parent
          created_at: log.created_at,
          updated_at: log.updated_at,
          assignees: [log.agent_type],
          created_by: cairnTask.payload.owner,
          team: cairnTask.payload.repos.join(', '),
          run_ids: [log.run_id],
          // Store the trace steps in a custom property
          log_data: log.log_data,
        };
      });
    }
    
    tasks.push(task);
  });
  
  return tasks;
}

// Enhanced function to create AgentNodes from Cairn data with proper trace steps
export function createAgentNodesFromCairnData(
  cairnTasks: CairnActiveTask[],
  taskLogs: CairnTaskLog[]
): AgentNode[] {
  const agentNodes: AgentNode[] = [];
  
  cairnTasks.forEach(cairnTask => {
    const payload = cairnTask.payload;
    const agentTypeInfo = mapAgentTypeToLevel(payload.agent_type);
    const status = mapAgentStatusToTaskStatus(payload.agent_status);
    
    // Create main task node
    const mainNode: AgentNode = {
      id: cairnTask.task_id,
      title: payload.description || 'Untitled Task',
      agentType: agentTypeInfo.type as any,
      status,
      progress: status === 'Done' || status === 'Completed' ? 100 : 
                status === 'Testing' || status === 'Agent Done: Review' ? 80 :
                status === 'In Progress' || status === 'Agent Working' ? 50 : 0,
      assignees: [payload.agent_type],
      description: payload.description,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
      level: 1, // Always level 1 for main tasks
      children: [],
      isAnimating: status === 'In Progress' || status === 'Agent Working',
      hasActiveAgent: true,
      run_ids: [payload.run_id],
      agent_output: payload.agent_output,
    };
    
    // Find associated logs and create child nodes
    const associatedLogs = taskLogs.filter(log => log.run_id === payload.run_id);
    
    associatedLogs.forEach((log, index) => {
      const logAgentTypeInfo = mapAgentTypeToLevel(log.agent_type);
      const traceSteps = transformLogDataToTraceSteps(log);
      
      // Create subtask node (level 2)
      const subtaskNode: AgentNode = {
        id: `${cairnTask.task_id}-subtask-${index}`,
        title: `${log.agent_type} Execution`,
        agentType: logAgentTypeInfo.type as any,
        status,
        progress: mainNode.progress,
        assignees: [log.agent_type],
        description: `Detailed execution by ${log.agent_type}`,
        created_at: log.created_at,
        updated_at: log.updated_at,
        parentId: cairnTask.task_id,
        level: 2,
        children: [],
        isAnimating: mainNode.isAnimating,
        run_ids: [log.run_id],
      };
      
      // Create engineering task node (level 3)
      const engineeringNode: AgentNode = {
        id: `${cairnTask.task_id}-engineering-${index}`,
        title: `Implementation Details`,
        agentType: 'SWE',
        status,
        progress: mainNode.progress,
        assignees: [log.agent_type],
        description: `Technical implementation details`,
        created_at: log.created_at,
        updated_at: log.updated_at,
        parentId: subtaskNode.id,
        level: 3,
        children: [],
        isAnimating: mainNode.isAnimating,
        run_ids: [log.run_id],
      };
      
      // Create trace node (level 4) with actual trace steps
      const traceNode: AgentNode = {
        id: `${cairnTask.task_id}-trace-${index}`,
        title: `Execution Trace`,
        agentType: 'Trace',
        status,
        progress: mainNode.progress,
        description: `Step-by-step execution trace`,
        created_at: log.created_at,
        updated_at: log.updated_at,
        parentId: engineeringNode.id,
        level: 4,
        traceSteps,
        isAnimating: mainNode.isAnimating,
        run_ids: [log.run_id],
      };
      
      // Build the hierarchy
      engineeringNode.children = [traceNode];
      subtaskNode.children = [engineeringNode];
      mainNode.children!.push(subtaskNode);
    });
    
    agentNodes.push(mainNode);
  });
  
  return agentNodes;
} 