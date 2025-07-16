import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter, Calendar, MapPin, CreditCard, Activity, Users, Clock, TrendingUp } from "lucide-react";
import { FilterOptions } from "@/types/membership";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableLocations: string[];
  availableMembershipTypes: string[];
  membershipData: any[];
}

export const FilterSidebar = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableLocations,
  availableMembershipTypes,
  membershipData
}: FilterSidebarProps) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      status: [],
      locations: [],
      membershipTypes: [],
      dateRange: { start: '', end: '' },
      sessionsRange: { min: 0, max: 100 },
      membershipUsage: [],
      groupBy: '',
      daysLapsed: { min: 0, max: 365 },
      paymentStatus: [],
      joinedDateRange: { start: '', end: '' }
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const toggleArrayFilter = (key: keyof Pick<FilterOptions, 'status' | 'locations' | 'membershipTypes' | 'membershipUsage' | 'paymentStatus'>, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  // Calculate membership usage categories
  const getUsageCategories = () => {
    const categories = new Set<string>();
    membershipData.forEach(member => {
      const totalSessions = member.totalSessions || member.sessionsLeft;
      const usedSessions = totalSessions - member.sessionsLeft;
      const usagePercent = totalSessions > 0 ? (usedSessions / totalSessions) * 100 : 0;
      
      if (usagePercent === 0) categories.add('Not Started');
      else if (usagePercent < 25) categories.add('Low Usage (0-25%)');
      else if (usagePercent < 50) categories.add('Medium Usage (25-50%)');
      else if (usagePercent < 75) categories.add('High Usage (50-75%)');
      else if (usagePercent < 100) categories.add('Very High Usage (75-99%)');
      else categories.add('Fully Used (100%)');
    });
    return Array.from(categories);
  };

  // Calculate days lapsed for expired members
  const getDaysLapsedStats = () => {
    const now = new Date();
    const expiredMembers = membershipData.filter(m => m.status === 'Expired');
    const daysLapsed = expiredMembers.map(member => {
      const endDate = new Date(member.endDate);
      const diffTime = now.getTime() - endDate.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    });
    
    return {
      min: Math.min(...daysLapsed, 0),
      max: Math.max(...daysLapsed, 365),
      avg: daysLapsed.length > 0 ? Math.round(daysLapsed.reduce((a, b) => a + b, 0) / daysLapsed.length) : 0
    };
  };

  const usageCategories = getUsageCategories();
  const daysLapsedStats = getDaysLapsedStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="w-96 h-full bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-none border-r animate-slide-in-right">
        <div className="p-6 space-y-6 h-full overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                <Filter className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Advanced Filters</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-accent/50">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Status Filter */}
            <div>
              <Label className="text-foreground flex items-center gap-2 mb-3 font-medium">
                <Activity className="h-4 w-4 text-primary" />
                Status
              </Label>
              <div className="flex flex-wrap gap-2">
                {['Active', 'Expired'].map(status => (
                  <Badge
                    key={status}
                    variant={localFilters.status.includes(status) ? "default" : "outline"}
                    className="cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={() => toggleArrayFilter('status', status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Membership Usage Filter */}
            <div>
              <Label className="text-foreground flex items-center gap-2 mb-3 font-medium">
                <TrendingUp className="h-4 w-4 text-primary" />
                Membership Usage
              </Label>
              <div className="flex flex-wrap gap-2">
                {usageCategories.map(category => (
                  <Badge
                    key={category}
                    variant={localFilters.membershipUsage?.includes(category) ? "default" : "outline"}
                    className="cursor-pointer text-xs transition-all duration-300 hover:scale-105"
                    onClick={() => toggleArrayFilter('membershipUsage', category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Group By */}
            <div>
              <Label className="text-foreground flex items-center gap-2 mb-3 font-medium">
                <Users className="h-4 w-4 text-primary" />
                Group By
              </Label>
              <Select
                value={localFilters.groupBy || 'none'}
                onValueChange={(value) => setLocalFilters(prev => ({ 
                  ...prev, 
                  groupBy: value === 'none' ? '' : value 
                }))}
              >
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue placeholder="Select grouping option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="membershipType">Membership Type</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="usage">Usage Level</SelectItem>
                  <SelectItem value="daysLapsed">Days Since Expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-border/50" />

            {/* Days Lapsed (for expired members) */}
            <div>
              <Label className="text-foreground flex items-center gap-2 mb-3 font-medium">
                <Clock className="h-4 w-4 text-primary" />
                Days Since Expiry
              </Label>
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Range: {daysLapsedStats.min} - {daysLapsedStats.max} days | Avg: {daysLapsedStats.avg} days
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Min Days</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={localFilters.daysLapsed?.min || 0}
                      onChange={(e) => setLocalFilters(prev => ({
                        ...prev,
                        daysLapsed: { ...prev.daysLapsed, min: parseInt(e.target.value) || 0 }
                      }))}
                      className="bg-background border-border/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Days</Label>
                    <Input
                      type="number"
                      placeholder="365"
                      value={localFilters.daysLapsed?.max || 365}
                      onChange={(e) => setLocalFilters(prev => ({
                        ...prev,
                        daysLapsed: { ...prev.daysLapsed, max: parseInt(e.target.value) || 365 }
                      }))}
                      className="bg-background border-border/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Locations */}
            <div>
              <Label className="text-foreground flex items-center gap-2 mb-3 font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Locations
              </Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableLocations.map(location => (
                  <Badge
                    key={location}
                    variant={localFilters.locations.includes(location) ? "default" : "outline"}
                    className="cursor-pointer text-xs transition-all duration-300 hover:scale-105"
                    onClick={() => toggleArrayFilter('locations', location)}
                  >
                    {location.split(',')[0]}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Membership Types */}
            <div>
              <Label className="text-foreground flex items-center gap-2 mb-3 font-medium">
                <CreditCard className="h-4 w-4 text-primary" />
                Membership Types
              </Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableMembershipTypes.map(type => (
                  <Badge
                    key={type}
                    variant={localFilters.membershipTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer text-xs transition-all duration-300 hover:scale-105"
                    onClick={() => toggleArrayFilter('membershipTypes', type)}
                  >
                    {type.length > 20 ? `${type.substring(0, 20)}...` : type}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Payment Status */}
            <div>
              <Label className="text-foreground flex items-center gap-2 mb-3 font-medium">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Status
              </Label>
              <div className="flex flex-wrap gap-2">
                {['Paid', 'Pending', 'Overdue'].map(status => (
                  <Badge
                    key={status}
                    variant={localFilters.paymentStatus?.includes(status) ? "default" : "outline"}
                    className="cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={() => toggleArrayFilter('paymentStatus', status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Expiry Date Range */}
            <div>
              <Label className="text-foreground flex items-center gap-2 mb-3 font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                Expiry Date Range
              </Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={localFilters.dateRange.start}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="bg-background border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={localFilters.dateRange.end}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="bg-background border-border/50"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Join Date Range */}
            <div>
              <Label className="text-foreground flex items-center gap-2 mb-3 font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                Join Date Range
              </Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={localFilters.joinedDateRange?.start || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      joinedDateRange: { ...prev.joinedDateRange, start: e.target.value }
                    }))}
                    className="bg-background border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={localFilters.joinedDateRange?.end || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      joinedDateRange: { ...prev.joinedDateRange, end: e.target.value }
                    }))}
                    className="bg-background border-border/50"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Sessions Range */}
            <div>
              <Label className="text-foreground mb-3 block font-medium">Sessions Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Min</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={localFilters.sessionsRange.min}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      sessionsRange: { ...prev.sessionsRange, min: parseInt(e.target.value) || 0 }
                    }))}
                    className="bg-background border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-xs">Max</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={localFilters.sessionsRange.max}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      sessionsRange: { ...prev.sessionsRange, max: parseInt(e.target.value) || 100 }
                    }))}
                    className="bg-background border-border/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-border/50">
            <Button 
              onClick={handleApplyFilters} 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
            >
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilters} className="border-border/50">
              Clear
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};