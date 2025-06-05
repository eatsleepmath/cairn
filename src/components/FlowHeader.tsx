import { Button } from '@/components/ui/button';
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
      <div className="backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-2.5 gap-4">
          {/* Left Section: Navigation */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Back Button */}
            {navigation.currentLevel > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackNavigation}
                className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back
              </Button>
            )}

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Button
                variant={navigation.currentLevel === 1 ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onNavigate(1)}
                className={cn(
                  "h-7 px-2.5 text-xs font-medium transition-all duration-200",
                  navigation.currentLevel === 1 
                    ? "bg-secondary/60 text-foreground shadow-none" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                <Home className="w-3.5 h-3.5 mr-1.5" />
                Tasks
              </Button>
              
              {navigation.breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.id} className="flex items-center gap-1.5 min-w-0">
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                  <Button
                    variant={index === navigation.breadcrumbs.length - 1 ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onNavigate(breadcrumb.level + 1, breadcrumb.id)}
                    className={cn(
                      "h-7 px-2.5 text-xs font-medium min-w-0 max-w-[160px] transition-all duration-200",
                      index === navigation.breadcrumbs.length - 1
                        ? "bg-secondary/60 text-foreground shadow-none"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    )}
                    title={breadcrumb.title}
                  >
                    <span className="truncate">{breadcrumb.title}</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Center Section: Level Stats */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-secondary/30 border border-border/30">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-primary/80" />
              <span className="text-xs font-medium text-foreground/90">
                {getLevelName(navigation.currentLevel)}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                L{navigation.currentLevel}
              </span>
            </div>
            
            <div className="w-px h-3 bg-border/40" />
            
            <div className="flex items-center gap-2.5 text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                <span className="font-medium text-foreground/80">{currentLevelStats.total}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400/70" />
                <span className="text-muted-foreground/80">{currentLevelStats.todo}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                <span className="text-muted-foreground/80">{currentLevelStats.inProgress}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/70" />
                <span className="text-muted-foreground/80">{currentLevelStats.testing}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                <span className="text-muted-foreground/80">{currentLevelStats.completed}</span>
              </div>
            </div>
          </div>

          {/* Right Section: Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-secondary/40"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin")} />
              Refresh
            </Button>
            
            <Button
              size="sm"
              variant={autoRefreshEnabled ? "secondary" : "ghost"}
              onClick={onToggleAutoRefresh}
              className={cn(
                "h-7 px-2.5 text-xs font-medium transition-all duration-200",
                autoRefreshEnabled 
                  ? "bg-secondary/60 text-foreground shadow-none" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              <Clock className={cn("w-3.5 h-3.5 mr-1.5", autoRefreshEnabled && "animate-pulse")} />
              Auto
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onFitView}
              className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-secondary/40"
            >
              <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
              Fit
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 