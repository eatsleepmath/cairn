import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AgentNode, NavigationState } from '@/types/agent-hierarchy';
import { motion } from 'framer-motion';
import {
    Activity,
    ArrowLeft,
    ChevronRight,
    Clock,
    Home,
    Maximize2,
    RefreshCw
} from 'lucide-react';

interface FlowHeaderProps {
  navigation: NavigationState;
  onNavigate: (level: number, parentId?: string) => void;
  allNodes: AgentNode[];
  currentLevelStats: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    testing: number;
  };
  onRefresh: () => void;
  onFitView: () => void;
  isLoading: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
}

const getLevelName = (level: number): string => {
  switch (level) {
    case 1: return 'Tasks';
    case 2: return 'Subtasks';
    case 3: return 'Engineering Tasks';
    case 4: return 'Execution Traces';
    default: return 'Unknown';
  }
};

export const FlowHeader: React.FC<FlowHeaderProps> = ({
  navigation,
  onNavigate,
  allNodes,
  currentLevelStats,
  onRefresh,
  onFitView,
  isLoading,
  autoRefreshEnabled,
  onToggleAutoRefresh,
}) => {
  const handleBackNavigation = () => {
    if (navigation.breadcrumbs.length > 0) {
      const previousBreadcrumb = navigation.breadcrumbs[navigation.breadcrumbs.length - 1];
      onNavigate(previousBreadcrumb.level, previousBreadcrumb.id);
    } else {
      onNavigate(1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flow-header absolute top-0 left-0 right-0 z-20"
    >
      <div className="header-section flex items-center justify-between px-6 py-4 gap-6">
        {/* Left Section: Navigation */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Back Button */}
          {navigation.currentLevel > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackNavigation}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {/* Breadcrumb Navigation */}
          <div className="breadcrumb-nav flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant={navigation.currentLevel === 1 ? "default" : "ghost"}
              size="sm"
              onClick={() => onNavigate(1)}
              className="shrink-0"
            >
              <Home className="w-4 h-4 mr-2" />
              Tasks
            </Button>
            
            {navigation.breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.id} className="flex items-center gap-2 min-w-0">
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <Button
                  variant={index === navigation.breadcrumbs.length - 1 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate(breadcrumb.level + 1, breadcrumb.id)}
                  className="min-w-0 max-w-[180px]"
                  title={breadcrumb.title}
                >
                  <span className="truncate">{breadcrumb.title}</span>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Center Section: Level Stats */}
        <Card className="stats-card px-4 py-2 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">
                {getLevelName(navigation.currentLevel)} (L{navigation.currentLevel})
              </span>
            </div>
            
            <Separator orientation="vertical" className="h-4" />
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="font-medium">{currentLevelStats.total}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span>{currentLevelStats.todo}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span>{currentLevelStats.inProgress}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span>{currentLevelStats.testing}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>{currentLevelStats.completed}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Section: Controls */}
        <div className="controls-section flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          
          <Button
            size="sm"
            variant={autoRefreshEnabled ? "default" : "outline"}
            onClick={onToggleAutoRefresh}
          >
            <Clock className={cn("w-4 h-4 mr-2", autoRefreshEnabled && "animate-pulse")} />
            Auto
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onFitView}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Fit View
          </Button>
        </div>
      </div>
    </motion.div>
  );
}; 