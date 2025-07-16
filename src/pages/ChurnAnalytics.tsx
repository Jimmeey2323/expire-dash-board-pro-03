import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { googleSheetsService } from "@/services/googleSheets";
import { MembershipData } from "@/types/membership";
import { TrendingDown, Calendar, Users, AlertTriangle, ArrowLeft, Calculator, BarChart3, FileSpreadsheet, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ChurnMetrics {
  month: string;
  startingMembers: number;
  newMembers: number;
  expiredMembers: number;
  endingMembers: number;
  churnRate: number;
  churnCount: number;
  retentionRate: number;
  netGrowth: number;
}

const ChurnAnalytics = () => {
  const {
    data: membershipData = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['membershipData'],
    queryFn: () => googleSheetsService.getMembershipData(),
    refetchInterval: 300000
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch membership data. Using sample data for demonstration.");
    }
  }, [error]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Get memberships expiring/expired in current month
  const currentMonthData = useMemo(() => {
    return membershipData.filter(member => {
      const endDate = new Date(member.endDate);
      return endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear;
    });
  }, [membershipData, currentMonth, currentYear]);

  // Enhanced churn metrics calculation
  const churnMetrics = useMemo(() => {
    const metrics: ChurnMetrics[] = [];
    const months = [];

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleString('default', {
          month: 'long',
          year: 'numeric'
        }),
        monthIndex: date.getMonth(),
        year: date.getFullYear()
      });
    }

    months.forEach((monthData, index) => {
      const monthStart = new Date(monthData.year, monthData.monthIndex, 1);
      const monthEnd = new Date(monthData.year, monthData.monthIndex + 1, 0);

      // Members active at start of month (had active membership before month started)
      const startingMembers = membershipData.filter(member => {
        const endDate = new Date(member.endDate);
        const orderDate = new Date(member.orderDate);
        return orderDate < monthStart && endDate >= monthStart;
      }).length;

      // New members who joined in this month
      const newMembers = membershipData.filter(member => {
        const orderDate = new Date(member.orderDate);
        return orderDate >= monthStart && orderDate <= monthEnd;
      }).length;

      // Members who expired/churned in this month
      const expiredMembers = membershipData.filter(member => {
        const endDate = new Date(member.endDate);
        return endDate >= monthStart && endDate <= monthEnd && member.status === 'Expired';
      }).length;

      // Active members at end of month
      const endingMembers = membershipData.filter(member => {
        const endDate = new Date(member.endDate);
        const orderDate = new Date(member.orderDate);
        return orderDate <= monthEnd && endDate > monthEnd;
      }).length;

      // Enhanced calculations
      const churnRate = startingMembers > 0 ? (expiredMembers / startingMembers) * 100 : 0;
      const retentionRate = startingMembers > 0 ? ((startingMembers - expiredMembers) / startingMembers) * 100 : 0;
      const netGrowth = newMembers - expiredMembers;

      metrics.push({
        month: monthData.month,
        startingMembers,
        newMembers,
        expiredMembers,
        endingMembers,
        churnRate: Number(churnRate.toFixed(2)),
        churnCount: expiredMembers,
        retentionRate: Number(retentionRate.toFixed(2)),
        netGrowth
      });
    });

    return metrics;
  }, [membershipData]);

  const currentMonthMetrics = churnMetrics[churnMetrics.length - 1];
  const previousMonthMetrics = churnMetrics[churnMetrics.length - 2];

  // Calculate additional insights
  const insights = useMemo(() => {
    const avgChurnRate = churnMetrics.reduce((sum, m) => sum + m.churnRate, 0) / churnMetrics.length;
    const avgRetentionRate = churnMetrics.reduce((sum, m) => sum + m.retentionRate, 0) / churnMetrics.length;
    const totalNetGrowth = churnMetrics.reduce((sum, m) => sum + m.netGrowth, 0);
    
    const highRiskMembers = membershipData.filter(member => {
      const endDate = new Date(member.endDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && member.status === 'Active';
    });

    return {
      avgChurnRate: Number(avgChurnRate.toFixed(2)),
      avgRetentionRate: Number(avgRetentionRate.toFixed(2)),
      totalNetGrowth,
      highRiskMembers: highRiskMembers.length,
      trend: currentMonthMetrics && previousMonthMetrics 
        ? currentMonthMetrics.churnRate > previousMonthMetrics.churnRate ? 'increasing' : 'decreasing'
        : 'stable'
    };
  }, [churnMetrics, membershipData, currentMonthMetrics, previousMonthMetrics]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 max-w-sm mx-auto bg-white/80 backdrop-blur-xl shadow-2xl border-white/20">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900">Loading Churn Analytics</h2>
            <p className="text-slate-600">Calculating churn metrics...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2 bg-white/50 backdrop-blur-sm border-white/30">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl shadow-xl">
                  <TrendingDown className="h-7 w-7" />
                </div>
                Churn Analytics
              </h1>
              <p className="text-slate-600 font-medium text-lg">
                Comprehensive membership churn analysis and retention insights
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <Card className="p-6 bg-white/80 backdrop-blur-xl border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg shadow-lg">
                <TrendingDown className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-700">Current Churn Rate</h3>
            </div>
            <p className="text-3xl font-bold text-red-600 mb-2">
              {currentMonthMetrics?.churnRate || 0}%
            </p>
            <div className="flex items-center gap-2">
              <Badge 
                className={cn(
                  "text-xs",
                  insights.trend === 'increasing' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                )}
              >
                {insights.trend === 'increasing' ? '↑' : '↓'} vs last month
              </Badge>
              <span className="text-sm text-slate-600">
                {currentMonthMetrics?.churnCount || 0} members lost
              </span>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-xl border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-700">Retention Rate</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {currentMonthMetrics?.retentionRate || 0}%
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 text-xs">
                Avg: {insights.avgRetentionRate}%
              </Badge>
              <span className="text-sm text-slate-600">
                12-month average
              </span>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-xl border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg shadow-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-700">High Risk Members</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600 mb-2">
              {insights.highRiskMembers}
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-700 text-xs">
                Expiring in 7 days
              </Badge>
              <span className="text-sm text-slate-600">
                Immediate attention needed
              </span>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-xl border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-lg">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-700">Net Growth</h3>
            </div>
            <p className={cn(
              "text-3xl font-bold mb-2",
              (currentMonthMetrics?.netGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {currentMonthMetrics?.netGrowth >= 0 ? '+' : ''}{currentMonthMetrics?.netGrowth || 0}
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700 text-xs">
                New - Churned
              </Badge>
              <span className="text-sm text-slate-600">
                This month
              </span>
            </div>
          </Card>
        </div>

        {/* Enhanced Churn Calculation */}
        <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-xl animate-slide-up">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Calculator className="h-6 w-6 text-blue-600" />
              Enhanced Churn Rate Calculation
            </h3>
            <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 p-6 rounded-2xl border-2 border-white/30 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Churn Rate Formula:</h4>
                    <div className="bg-white/70 p-4 rounded-lg border border-white/40 font-mono text-lg backdrop-blur-sm">
                      <span className="text-red-600 font-bold">Churn Rate = (Members Lost / Starting Members) × 100</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Retention Rate Formula:</h4>
                    <div className="bg-white/70 p-4 rounded-lg border border-white/40 font-mono text-lg backdrop-blur-sm">
                      <span className="text-green-600 font-bold">Retention Rate = ((Starting - Lost) / Starting) × 100</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/70 p-4 rounded-lg border border-white/30 backdrop-blur-sm">
                    <h5 className="font-semibold text-slate-700 mb-2">Starting Members</h5>
                    <p className="text-sm text-slate-600 mb-2">Active at month start</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {currentMonthMetrics?.startingMembers || 0}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-white/30 backdrop-blur-sm">
                    <h5 className="font-semibold text-slate-700 mb-2">Members Lost</h5>
                    <p className="text-sm text-slate-600 mb-2">Expired this month</p>
                    <p className="text-2xl font-bold text-red-600">
                      {currentMonthMetrics?.expiredMembers || 0}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-white/30 backdrop-blur-sm">
                    <h5 className="font-semibold text-slate-700 mb-2">Churn Calculation</h5>
                    <p className="text-sm text-slate-600 mb-2">
                      ({currentMonthMetrics?.expiredMembers || 0} ÷ {currentMonthMetrics?.startingMembers || 1}) × 100
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      = {currentMonthMetrics?.churnRate || 0}%
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-white/30 backdrop-blur-sm">
                    <h5 className="font-semibold text-slate-700 mb-2">Retention Rate</h5>
                    <p className="text-sm text-slate-600 mb-2">Members retained</p>
                    <p className="text-2xl font-bold text-green-600">
                      {currentMonthMetrics?.retentionRate || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Detailed Tables */}
        <Tabs defaultValue="current-month" className="space-y-6 animate-slide-up">
          <Card className="p-2 bg-white/80 backdrop-blur-xl border-white/20 shadow-xl">
            <TabsList className="grid w-full grid-cols-3 bg-white/50 gap-1 p-1">
              <TabsTrigger 
                value="current-month" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white font-semibold"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Current Month
              </TabsTrigger>
              <TabsTrigger 
                value="trends" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Monthly Trends
              </TabsTrigger>
              <TabsTrigger 
                value="detailed-list" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Risk Analysis
              </TabsTrigger>
            </TabsList>
          </Card>

          <TabsContent value="current-month">
            <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-xl">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Current Month Analysis ({currentMonthData.length} members)
                </h3>
                <div className="border-2 border-white/20 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 border-b-2 border-white/30 backdrop-blur-sm">
                        <TableHead className="font-bold text-slate-700">Member ID</TableHead>
                        <TableHead className="font-bold text-slate-700">Name</TableHead>
                        <TableHead className="font-bold text-slate-700">Email</TableHead>
                        <TableHead className="font-bold text-slate-700">Membership</TableHead>
                        <TableHead className="font-bold text-slate-700">End Date</TableHead>
                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                        <TableHead className="font-bold text-slate-700">Sessions Left</TableHead>
                        <TableHead className="font-bold text-slate-700">Risk Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentMonthData.map(member => {
                        const endDate = new Date(member.endDate);
                        const now = new Date();
                        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        
                        let riskLevel = 'Low';
                        let riskColor = 'bg-green-100 text-green-700';
                        
                        if (member.status === 'Expired') {
                          riskLevel = 'Churned';
                          riskColor = 'bg-red-100 text-red-700';
                        } else if (daysUntilExpiry <= 7) {
                          riskLevel = 'Critical';
                          riskColor = 'bg-red-100 text-red-700';
                        } else if (daysUntilExpiry <= 14) {
                          riskLevel = 'High';
                          riskColor = 'bg-orange-100 text-orange-700';
                        } else if (daysUntilExpiry <= 30) {
                          riskLevel = 'Medium';
                          riskColor = 'bg-yellow-100 text-yellow-700';
                        }
                        
                        return (
                          <TableRow key={member.uniqueId} className="border-b border-white/20 hover:bg-white/30 transition-all duration-150 backdrop-blur-sm">
                            <TableCell className="font-mono text-sm">{member.memberId}</TableCell>
                            <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                            <TableCell className="text-slate-600">{member.email}</TableCell>
                            <TableCell className="text-slate-600">{member.membershipName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{new Date(member.endDate).toLocaleDateString()}</span>
                                {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                                  <Badge className="text-xs bg-amber-100 text-amber-700">
                                    {daysUntilExpiry}d
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={cn(
                                  "w-20 h-7 flex items-center justify-center font-bold text-xs",
                                  member.status === 'Active' 
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                                    : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                                )}
                              >
                                {member.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                className={cn(
                                  "w-16 h-7 flex items-center justify-center font-bold text-xs",
                                  member.sessionsLeft > 5 
                                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white" 
                                    : member.sessionsLeft > 0 
                                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" 
                                      : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                                )}
                              >
                                {member.sessionsLeft}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("font-bold text-xs", riskColor)}>
                                {riskLevel}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-xl">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  12-Month Churn & Retention Trends
                </h3>
                <div className="border-2 border-white/20 rounded-2xl overflow-hidden backdrop-blur-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 border-b-2 border-white/30 backdrop-blur-sm">
                        <TableHead className="font-bold text-slate-700">Month</TableHead>
                        <TableHead className="font-bold text-slate-700">Starting</TableHead>
                        <TableHead className="font-bold text-slate-700">New</TableHead>
                        <TableHead className="font-bold text-slate-700">Lost</TableHead>
                        <TableHead className="font-bold text-slate-700">Ending</TableHead>
                        <TableHead className="font-bold text-slate-700">Churn Rate</TableHead>
                        <TableHead className="font-bold text-slate-700">Retention</TableHead>
                        <TableHead className="font-bold text-slate-700">Net Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {churnMetrics.map((metric, index) => (
                        <TableRow key={metric.month} className="border-b border-white/20 hover:bg-white/30 transition-all duration-150 backdrop-blur-sm">
                          <TableCell className="font-medium">{metric.month}</TableCell>
                          <TableCell className="text-center">{metric.startingMembers}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-green-600 font-medium">+{metric.newMembers}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-red-600 font-medium">-{metric.expiredMembers}</span>
                          </TableCell>
                          <TableCell className="text-center">{metric.endingMembers}</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={cn(
                                "font-bold text-xs w-16 h-7 flex items-center justify-center",
                                metric.churnRate > 15 
                                  ? "bg-gradient-to-r from-red-500 to-rose-600 text-white" 
                                  : metric.churnRate > 10 
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" 
                                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                              )}
                            >
                              {metric.churnRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-blue-100 text-blue-700 font-bold text-xs">
                              {metric.retentionRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "font-medium",
                              metric.netGrowth >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {metric.netGrowth >= 0 ? '+' : ''}{metric.netGrowth}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="detailed-list">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-xl border-red-100/50 shadow-xl">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Risk Members ({insights.highRiskMembers})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {membershipData
                      .filter(member => {
                        const endDate = new Date(member.endDate);
                        const now = new Date();
                        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && member.status === 'Active';
                      })
                      .map(member => {
                        const endDate = new Date(member.endDate);
                        const now = new Date();
                        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div key={member.uniqueId} className="p-4 bg-red-50/80 border border-red-200/50 rounded-lg backdrop-blur-sm">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-semibold text-slate-800">
                                {member.firstName} {member.lastName}
                              </h5>
                              <Badge className="text-xs bg-red-100 text-red-800">
                                {daysUntilExpiry} days left
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">
                              <strong>Email:</strong> {member.email}
                            </p>
                            <p className="text-sm text-slate-600 mb-1">
                              <strong>Membership:</strong> {member.membershipName}
                            </p>
                            <p className="text-sm text-slate-600 mb-1">
                              <strong>Sessions Left:</strong> {member.sessionsLeft}
                            </p>
                            <p className="text-sm text-slate-600">
                              <strong>Location:</strong> {member.location}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </Card>

              <Card className="bg-white/80 backdrop-blur-xl border-green-100/50 shadow-xl">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Retention Insights
                  </h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50/80 border border-green-200/50 rounded-lg backdrop-blur-sm">
                      <h5 className="font-semibold text-green-800 mb-2">Average Retention Rate</h5>
                      <p className="text-2xl font-bold text-green-600">{insights.avgRetentionRate}%</p>
                      <p className="text-sm text-green-700">Over the last 12 months</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50/80 border border-blue-200/50 rounded-lg backdrop-blur-sm">
                      <h5 className="font-semibold text-blue-800 mb-2">Total Net Growth</h5>
                      <p className={cn(
                        "text-2xl font-bold",
                        insights.totalNetGrowth >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {insights.totalNetGrowth >= 0 ? '+' : ''}{insights.totalNetGrowth}
                      </p>
                      <p className="text-sm text-blue-700">New members minus churned</p>
                    </div>
                    
                    <div className="p-4 bg-purple-50/80 border border-purple-200/50 rounded-lg backdrop-blur-sm">
                      <h5 className="font-semibold text-purple-800 mb-2">Churn Trend</h5>
                      <p className={cn(
                        "text-lg font-bold capitalize",
                        insights.trend === 'increasing' ? "text-red-600" : "text-green-600"
                      )}>
                        {insights.trend}
                      </p>
                      <p className="text-sm text-purple-700">Compared to previous month</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChurnAnalytics;