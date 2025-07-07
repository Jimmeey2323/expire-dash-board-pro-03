import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  Users, 
  UserCheck, 
  UserX, 
  Dumbbell,
  Calendar,
  MapPin,
  Clock,
  TrendingUp,
  Filter,
  Sparkles,
  X
} from "lucide-react";

interface CollapsibleFiltersProps {
  quickFilter: string[];
  onQuickFilterChange: (filters: string[]) => void;
  membershipData: any[];
  availableLocations: string[];
}

export const CollapsibleFilters = ({ 
  quickFilter, 
  onQuickFilterChange, 
  membershipData,
  availableLocations 
}: CollapsibleFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeMembers = membershipData.filter(m => m.status === 'Active');
  const expiredMembers = membershipData.filter(m => m.status === 'Expired');
  const membersWithSessions = membershipData.filter(m => m.sessionsLeft > 0);
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentMembers = membershipData.filter(m => new Date(m.orderDate) >= thirtyDaysAgo);
  const weeklyMembers = membershipData.filter(m => new Date(m.orderDate) >= sevenDaysAgo);
  const expiringThisMonth = membershipData.filter(m => {
    const endDate = new Date(m.endDate);
    return endDate >= now && endDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  });

  const filterGroups = [
    {
      title: "Status Filters",
      filters: [
        { key: 'all', label: 'All Members', count: membershipData.length, icon: Users },
        { key: 'active', label: 'Active', count: activeMembers.length, icon: UserCheck },
        { key: 'expired', label: 'Expired', count: expiredMembers.length, icon: UserX },
        { key: 'sessions', label: 'With Sessions', count: membersWithSessions.length, icon: Dumbbell },
        { key: 'no-sessions', label: 'No Sessions', count: membershipData.length - membersWithSessions.length, icon: Clock }
      ]
    },
    {
      title: "Period Filters",
      filters: [
        { key: 'recent', label: 'Last 30 Days', count: recentMembers.length, icon: TrendingUp },
        { key: 'weekly', label: 'This Week', count: weeklyMembers.length, icon: Calendar },
        { key: 'expiring', label: 'Expiring Soon', count: expiringThisMonth.length, icon: Clock }
      ]
    },
    {
      title: "Location Filters",
      filters: availableLocations.slice(0, 6).map(location => ({
        key: `location-${location}`,
        label: location.split(',')[0] || location,
        count: membershipData.filter(member => member.location === location).length,
        icon: MapPin
      }))
    }
  ];

  const handleFilterToggle = (filterKey: string) => {
    if (filterKey === 'all') {
      onQuickFilterChange([]);
      return;
    }

    const currentFilters = [...quickFilter];
    const filterIndex = currentFilters.indexOf(filterKey);
    
    if (filterIndex >= 0) {
      // Remove filter if it exists
      currentFilters.splice(filterIndex, 1);
    } else {
      // Add filter if it doesn't exist
      currentFilters.push(filterKey);
    }
    
    onQuickFilterChange(currentFilters);
  };

  const clearAllFilters = () => {
    onQuickFilterChange([]);
  };

  const isFilterActive = (filterKey: string) => {
    if (filterKey === 'all') {
      return quickFilter.length === 0;
    }
    return quickFilter.includes(filterKey);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-6 cursor-pointer hover:bg-white/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl">
                  <Filter className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Smart Multi-Filters
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </h3>
                  <p className="text-slate-600 font-medium">
                    {quickFilter.length > 0 ? `${quickFilter.length} filter(s) active` : 'Click to expand filter options'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {quickFilter.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-w-md">
                    {quickFilter.slice(0, 3).map((filter, index) => {
                      const filterData = filterGroups
                        .flatMap(group => group.filters)
                        .find(f => f.key === filter);
                      
                      return (
                        <Badge 
                          key={index} 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg flex items-center gap-1"
                        >
                          {filterData?.label || filter}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterToggle(filter);
                            }}
                            className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    {quickFilter.length > 3 && (
                      <Badge className="bg-slate-500 text-white border-0">
                        +{quickFilter.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                {quickFilter.length > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllFilters();
                    }}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 bg-white/50 backdrop-blur-sm"
                  >
                    Clear All
                  </Button>
                )}
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-600" /> : <ChevronDown className="h-5 w-5 text-slate-600" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-6 border-t border-white/20">
            {filterGroups.map((group, groupIndex) => (
              <div key={group.title} className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 mt-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                  {group.title}
                </h4>
                <div className="flex flex-wrap gap-3">
                  {group.filters.map((filter) => (
                    <Button
                      key={filter.key}
                      variant={isFilterActive(filter.key) ? "default" : "outline"}
                      onClick={() => handleFilterToggle(filter.key)}
                      className={`h-auto py-3 px-4 flex items-center gap-3 transition-all duration-300 font-semibold ${
                        isFilterActive(filter.key)
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105 border-transparent' 
                          : 'border-white/30 bg-white/50 text-slate-700 hover:bg-white/70 hover:scale-105 hover:shadow-lg backdrop-blur-sm'
                      }`}
                    >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        isFilterActive(filter.key)
                          ? 'bg-white/20' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}>
                        <filter.icon className={`h-4 w-4 ${
                          isFilterActive(filter.key) ? 'text-white' : 'text-white'
                        }`} />
                      </div>
                      <span>{filter.label}</span>
                      <Badge 
                        className={`ml-1 font-bold transition-all duration-300 ${
                          isFilterActive(filter.key)
                            ? 'bg-white/20 text-white border-white/30 shadow-sm' 
                            : 'bg-slate-100 border-slate-300'
                        }`}
                      >
                        {filter.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-slate-600 bg-blue-50/50 p-3 rounded-lg border border-blue-200/30">
                <strong>Multi-Select:</strong> You can now select multiple filters simultaneously to create complex filter combinations. 
                For example, select both "Active\" and "With Sessions\" to see only active members who have remaining sessions.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};