
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  tooltip?: string;
  drillDownData?: {
    label: string;
    value: string | number;
  }[];
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = 'neutral', 
  className = '', 
  tooltip,
  drillDownData = []
}: MetricCardProps) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-emerald-600';
      case 'down': return 'text-red-600';
      default: return 'text-slate-500';
    }
  };

  const getIconBg = () => {
    switch (trend) {
      case 'up': return 'bg-emerald-100 text-emerald-600';
      case 'down': return 'bg-red-100 text-red-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const getBorderGradient = () => {
    switch (trend) {
      case 'up': return 'border-l-emerald-500';
      case 'down': return 'border-l-red-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`bg-white border-2 border-slate-100 border-l-4 ${getBorderGradient()} p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-help ${className}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    {title}
                  </p>
                  {tooltip && <Info className="h-4 w-4 text-slate-400" />}
                </div>
                
                <div className="space-y-3">
                  <p className="text-3xl font-bold text-slate-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                  
                  {change && (
                    <div className="flex items-center gap-2">
                      {trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                      {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                      <span className={`text-sm font-semibold ${getTrendColor()}`}>
                        {change}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded-2xl ${getIconBg()} shadow-sm`}>
                <Icon className="h-8 w-8" />
              </div>
            </div>
            
            {drillDownData.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  {drillDownData.slice(0, 4).map((item, index) => (
                    <div key={index} className="text-center">
                      <p className="text-lg font-bold text-slate-700">{item.value}</p>
                      <p className="text-xs text-slate-500 font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent side="top" className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
