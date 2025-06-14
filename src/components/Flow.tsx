import { FlowHeader } from '@/components/FlowHeader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTasks } from '@/contexts/TaskContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  calculateTreeLayout,
  createTreeEdges,
  findNodeById,
  flattenAgentHierarchy,
  getAgentColor,
  getAgentIcon,
  getChildrenForNavigation,
  getTreeStats,
  taskToAgentHierarchy,
  updateNavigationState
} from '@/lib/utils/agent-hierarchy';
import '@/styles/flow.css';
import { TaskStatus } from '@/types';
import { AgentNode, NavigationState } from '@/types/agent-hierarchy';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  GitBranch,
  Loader2,
  Users,
  ZoomIn
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  BaseEdge,
  Connection,
  Controls,
  Edge,
  EdgeProps,
  EdgeTypes,
  getBezierPath,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  NodeTypes,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

// Enhanced TaskNode component for hierarchical agent views
const AgentTaskNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const agentNode = data as AgentNode & { 
    onClick?: (nodeId: string) => void;
    viewMode?: 'hierarchical' | 'tree';
  };
  const agentColor = getAgentColor(agentNode.agentType);
  const agentIcon = getAgentIcon(agentNode.agentType);
  
  const statusColors: Record<TaskStatus, string> = {
    'Todo': 'bg-red-500/20 border-red-500/50 text-red-400',
    'Backlog': 'bg-gray-500/20 border-gray-500/50 text-gray-400',
    'In Progress': 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    'Testing': 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    'Done': 'bg-green-500/20 border-green-500/50 text-green-400',
    'Completed': 'bg-green-500/20 border-green-500/50 text-green-400',
    'Agent Done: Review': 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    'Agent Failed': 'bg-red-600/20 border-red-600/50 text-red-600',
    'Agent Working': 'bg-orange-500/20 border-orange-500/50 text-orange-400'
  };

  const priorityColors = {
    'Low': 'text-green-400',
    'Medium': 'text-yellow-400',
    'High': 'text-orange-400',
    'Urgent': 'text-red-400'
  };

  const statusIcons: Record<TaskStatus, React.ReactElement> = {
    'Todo': <Clock className="w-3 h-3" />,
    'Backlog': <Clock className="w-3 h-3" />,
    'In Progress': <Activity className="w-3 h-3 animate-spin" />,
    'Testing': <GitBranch className="w-3 h-3" />,
    'Done': <CheckCircle2 className="w-3 h-3" />,
    'Completed': <CheckCircle2 className="w-3 h-3" />,
    'Agent Done: Review': <Bot className="w-3 h-3" />,
    'Agent Failed': <Bot className="w-3 h-3" />,
    'Agent Working': <Bot className="w-3 h-3 animate-spin" />
  };

  const hasChildren = agentNode.children && agentNode.children.length > 0;
  const canZoomIn = agentNode.viewMode === 'hierarchical' && (hasChildren || agentNode.level < 4);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flow-node px-3.5 py-2.5 rounded-lg border min-w-[200px] max-w-[300px] transition-all duration-300 cursor-pointer backdrop-blur-sm",
        agentColor.bg,
        agentColor.border,
        isDark ? 'shadow-lg shadow-black/10' : 'shadow-sm shadow-black/5',
        agentNode.isAnimating && 'animate-pulse',
        selected && 'ring-1 ring-primary/60 ring-offset-1 ring-offset-background'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => agentNode.onClick?.(agentNode.id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-2 !h-2 !border-2 !border-background opacity-0 hover:opacity-100 transition-opacity"
      />
      
      <div className="space-y-1.5">
        {/* Header with agent type and zoom indicator */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-base opacity-80">{agentIcon}</span>
            <div className="flex-1">
              <h3 className="font-medium text-xs line-clamp-2 text-foreground/90">{agentNode.title}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0.5 border-border/40", agentColor.text)}>
                  {agentNode.agentType}
                </Badge>
                <span className="text-[9px] text-muted-foreground/70 font-mono">L{agentNode.level}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-muted-foreground/60">
              {statusIcons[agentNode.status as TaskStatus]}
            </div>
            {canZoomIn && (
              <ZoomIn className="w-3 h-3 text-muted-foreground/40" />
            )}
          </div>
        </div>
        
        {/* Status and priority */}
        <div className="flex items-center gap-1.5 text-xs">
          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0.5 border-border/40", statusColors[agentNode.status])}>
            {agentNode.status}
          </Badge>
          {agentNode.priority && (
            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0.5 border-border/40", agentNode.priority && priorityColors[agentNode.priority as keyof typeof priorityColors])}>
              {agentNode.priority}
            </Badge>
          )}
        </div>

        {/* Children count for navigation levels */}
        {hasChildren && agentNode.children && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <GitBranch className="w-2.5 h-2.5" />
            <span>{agentNode.children.length} {agentNode.level === 1 ? 'subtasks' : agentNode.level === 2 ? 'engineering tasks' : 'traces'}</span>
          </div>
        )}

        {/* Assignees */}
        {agentNode.assignees && agentNode.assignees.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <Users className="w-2.5 h-2.5" />
            <span>{agentNode.assignees.length} assigned</span>
          </div>
        )}

        {/* Due date */}
        {agentNode.due_date && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <Clock className="w-2.5 h-2.5" />
            <span>{format(new Date(agentNode.due_date), 'MMM d')}</span>
          </div>
        )}

        {/* Progress bar */}
        {agentNode.progress !== undefined && agentNode.progress > 0 && (
          <div className="relative">
            <Progress value={agentNode.progress} className="h-1" />
            <span className="absolute -top-4 right-0 text-[9px] text-muted-foreground/60 font-mono">
              {agentNode.progress}%
            </span>
          </div>
        )}

        {/* Trace steps count for level 4 */}
        {agentNode.level === 4 && agentNode.traceSteps && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <Activity className="w-2.5 h-2.5" />
            <span>{agentNode.traceSteps.length} trace steps</span>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !w-2 !h-2 !border-2 !border-background opacity-0 hover:opacity-100 transition-opacity"
      />
    </motion.div>
  );
};

// Enhanced edge component with animation
const AnimatedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {data?.isAnimating && (
        <circle className="edge-animation" r="4" fill="#5e6ad2">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
};

// Flow component with hierarchical navigation
function Flow() {
  const { tasks, refreshTasks, isLoading, autoRefreshEnabled, setAutoRefreshEnabled } = useTasks();
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedAgentNode, setSelectedAgentNode] = useState<AgentNode | null>(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const { fitView } = useReactFlow();
  const fitViewRef = useRef(fitView);

  // Navigation state for hierarchical browsing
  const [navigation, setNavigation] = useState<NavigationState>({
    currentLevel: 1,
    currentParentId: undefined,
    breadcrumbs: [],
    selectedNodeId: undefined,
  });

  // All agent nodes (complete hierarchy)
  const [allAgentNodes, setAllAgentNodes] = useState<AgentNode[]>([]);

  // View mode for switching between hierarchical and tree views
  const [viewMode, setViewMode] = useState<'hierarchical' | 'tree'>('hierarchical');

  // Toggle between view modes
  const handleToggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'hierarchical' ? 'tree' : 'hierarchical');
  }, []);

  // Update fitView ref when it changes
  useEffect(() => {
    fitViewRef.current = fitView;
  }, [fitView]);

  const nodeTypes = useMemo<NodeTypes>(() => ({ agentTaskNode: AgentTaskNode }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ animated: AnimatedEdge }), []);

  // Transform tasks to agent hierarchy when tasks change
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setAllAgentNodes([]);
      return;
    }

    const hierarchy: AgentNode[] = [];
    tasks.forEach(task => {
      const agentNodes = taskToAgentHierarchy(task);
      hierarchy.push(...agentNodes);
    });
    
    setAllAgentNodes(hierarchy);
  }, [tasks]);

  // Layout algorithm for hierarchical view
  const calculateHierarchicalLayout = useCallback((nodes: AgentNode[]) => {
    const positions = new Map<string, { x: number; y: number }>();
    
    // Different layouts based on level
    if (navigation.currentLevel === 1) {
      // Grid layout for top-level tasks
      nodes.forEach((node, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = col * 400 + 200;
        const y = row * 300 + 150;
        positions.set(node.id, { x, y });
      });
    } else if (navigation.currentLevel === 4) {
      // Timeline layout for trace steps
      nodes.forEach((node, index) => {
        const x = 200;
        const y = index * 150 + 100;
        positions.set(node.id, { x, y });
      });
    } else {
      // Tree layout for intermediate levels
      const centerX = 500;
      let yOffset = 100;
      
      nodes.forEach((node, index) => {
        const x = centerX + (index - (nodes.length - 1) / 2) * 350;
        const y = yOffset;
        positions.set(node.id, { x, y });
        yOffset += 200;
      });
    }
    
    return positions;
  }, [navigation.currentLevel]);

  // Convert agent nodes to flow nodes and edges for current level
  useEffect(() => {
    if (viewMode === 'tree') {
      // Tree view: show all nodes in a flattened tree structure
      const flattenedNodes = flattenAgentHierarchy(allAgentNodes);
      
      if (flattenedNodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      const positions = calculateTreeLayout(flattenedNodes);
      const flowNodes: Node[] = [];
      const treeEdges = createTreeEdges(flattenedNodes);

      flattenedNodes.forEach((agentNode) => {
        const pos = positions.get(agentNode.id) || { x: 0, y: 0 };

        flowNodes.push({
          id: agentNode.id,
          type: 'agentTaskNode',
          position: pos,
          data: {
            ...agentNode,
            onClick: handleNodeClick,
            viewMode: viewMode,
          },
        });
      });

      setNodes(flowNodes);
      setEdges(treeEdges);
    } else {
      // Hierarchical view: existing logic
      const currentLevelNodes = getChildrenForNavigation(
        allAgentNodes,
        navigation.currentParentId,
        navigation.currentLevel
      );

      if (currentLevelNodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      const positions = calculateHierarchicalLayout(currentLevelNodes);
      const flowNodes: Node[] = [];
      const flowEdges: Edge[] = [];

      currentLevelNodes.forEach((agentNode, index) => {
        const pos = positions.get(agentNode.id) || { x: 0, y: 0 };

        flowNodes.push({
          id: agentNode.id,
          type: 'agentTaskNode',
          position: pos,
          data: {
            ...agentNode,
            onClick: handleNodeClick,
            viewMode: viewMode,
          },
        });

        // Create edges between related nodes
        if (index > 0 && navigation.currentLevel <= 3) {
          const prevNode = currentLevelNodes[index - 1];
          flowEdges.push({
            id: `${prevNode.id}-${agentNode.id}`,
            source: prevNode.id,
            target: agentNode.id,
            type: 'animated',
            animated: agentNode.isAnimating,
            style: { stroke: '#5e6ad2', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#5e6ad2',
            },
            data: { isAnimating: agentNode.isAnimating },
          });
        }
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [allAgentNodes, navigation, calculateHierarchicalLayout, viewMode]);

  // Fit view when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitViewRef.current({ duration: 800 }), 100);
    }
  }, [nodes.length, navigation.currentLevel]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Handle node click for navigation
  const handleNodeClick = useCallback((nodeId: string) => {
    const node = findNodeById(allAgentNodes, nodeId);
    if (!node) return;

    if (viewMode === 'tree') {
      // In tree mode, always show details since all levels are visible
      setSelectedAgentNode(node);
      setShowNodeDetails(true);
    } else {
      // In hierarchical mode, navigate or show details
      const hasChildren = node.children && node.children.length > 0;
      const canGoDeeper = node.level < 4;

      if (hasChildren || canGoDeeper) {
        // Navigate to next level
        const newState = updateNavigationState(
          navigation,
          nodeId,
          allAgentNodes,
          'zoom-in'
        );
        setNavigation(newState);
      } else {
        // Show details in sidebar
        setSelectedAgentNode(node);
        setShowNodeDetails(true);
      }
    }
  }, [allAgentNodes, navigation, viewMode]);

  // Handle navigation between levels
  const handleNavigate = useCallback((level: number, parentId?: string) => {
    setNavigation(prev => {
      // Build breadcrumbs based on navigation
      const breadcrumbs = [];
      if (parentId) {
        const parentNode = findNodeById(allAgentNodes, parentId);
        if (parentNode) {
          // Build breadcrumb trail
          let current: AgentNode | undefined = parentNode;
          while (current && current.level > 1) {
            breadcrumbs.unshift({
              id: current.id,
              title: current.title,
              level: current.level,
            });
            
            if (current.parentId) {
              current = findNodeById(allAgentNodes, current.parentId);
            } else {
              break;
            }
          }
        }
      }

      return {
        currentLevel: level,
        currentParentId: parentId,
        breadcrumbs,
        selectedNodeId: undefined,
      };
    });
  }, [allAgentNodes]);

  // Get current level statistics
  const getCurrentLevelStats = useMemo(() => {
    if (viewMode === 'tree') {
      // Tree view: show stats for all nodes
      const flattenedNodes = flattenAgentHierarchy(allAgentNodes);
      return getTreeStats(flattenedNodes);
    } else {
      // Hierarchical view: show stats for current level
      const currentNodes = getChildrenForNavigation(
        allAgentNodes,
        navigation.currentParentId,
        navigation.currentLevel
      );

      const stats = {
        total: currentNodes.length,
        completed: currentNodes.filter(n => n.status === 'Completed' || n.status === 'Done').length,
        inProgress: currentNodes.filter(n => n.status === 'In Progress' || n.status === 'Agent Working').length,
        todo: currentNodes.filter(n => n.status === 'Todo').length,
        testing: currentNodes.filter(n => n.status === 'Testing').length,
      };

      return stats;
    }
  }, [allAgentNodes, navigation, viewMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flow-container h-full relative">
        {/* Flow Header */}
        <FlowHeader
          navigation={navigation}
          onNavigate={handleNavigate}
          allNodes={allAgentNodes}
          currentLevelStats={getCurrentLevelStats}
          onRefresh={() => refreshTasks()}
          onFitView={() => fitView({ duration: 800 })}
          isLoading={isLoading}
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
        />

        <div className="absolute inset-0 pt-[50px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="w-full h-full"
            style={{
              backgroundColor: 'hsl(var(--background))'
            }}
          >
            <Background 
              gap={16} 
              size={1} 
              color={theme === 'dark' ? '#606060' : '#e4e4e7'}
            />
            <Controls 
              className={cn(
                "flow-controls",
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              )}
            />
            <MiniMap 
              className={cn(
                "flow-minimap",
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              )}
              nodeColor={(node) => {
                const agentNode = node.data as AgentNode;
                const color = getAgentColor(agentNode.agentType);
                return color.border.includes('purple') ? '#a855f7' :
                       color.border.includes('blue') ? '#3b82f6' :
                       color.border.includes('green') ? '#22c55e' :
                       color.border.includes('orange') ? '#f97316' : '#6b7280';
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Node Details Sheet */}
      <Sheet open={showNodeDetails} onOpenChange={setShowNodeDetails}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedAgentNode && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-lg">{getAgentIcon(selectedAgentNode.agentType)}</span>
                  <div>
                    <span>{selectedAgentNode.title}</span>
                    <div className="text-sm font-normal text-muted-foreground mt-1">
                      {selectedAgentNode.agentType} Agent - Level {selectedAgentNode.level}
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Status</h4>
                  <Badge variant="outline" className="text-sm">
                    {selectedAgentNode.status}
                  </Badge>
                </div>

                {selectedAgentNode.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedAgentNode.description}</p>
                  </div>
                )}

                {selectedAgentNode.priority && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Priority</h4>
                    <Badge variant="outline" className="text-sm">
                      {selectedAgentNode.priority}
                    </Badge>
                  </div>
                )}

                {selectedAgentNode.progress !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Progress</h4>
                    <div className="space-y-2">
                      <Progress value={selectedAgentNode.progress} className="h-2" />
                      <span className="text-sm text-muted-foreground">{selectedAgentNode.progress}% complete</span>
                    </div>
                  </div>
                )}

                {selectedAgentNode.assignees && selectedAgentNode.assignees.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Assignees</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgentNode.assignees.map((assignee, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {assignee.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{assignee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trace Steps for Level 4 */}
                {selectedAgentNode.level === 4 && selectedAgentNode.traceSteps && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Execution Trace</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {selectedAgentNode.traceSteps.map((step, index) => (
                        <div key={step.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {step.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(step.timestamp), 'HH:mm:ss')}
                            </span>
                          </div>
                          <p className="text-sm">{step.content}</p>
                          {step.tool_name && (
                            <div className="text-xs text-muted-foreground">
                              Tool: {step.tool_name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => setShowNodeDetails(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function FlowPage() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
} 