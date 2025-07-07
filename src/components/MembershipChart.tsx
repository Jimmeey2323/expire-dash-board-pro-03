
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { MembershipData } from "@/types/membership";
import { TrendingUp, Users, MapPin, Calendar, BarChart3 } from "lucide-react";

interface MembershipChartProps {
  data: MembershipData[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

export const MembershipChart = ({ data }: MembershipChartProps) => {
  const [activeChart, setActiveChart] = useState<'status' | 'types' | 'locations' | 'trends'>('status');

  const statusData = data.reduce((acc, member) => {
    acc[member.status] = (acc[member.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  const membershipTypeData = data.reduce((acc, member) => {
    acc[member.membershipName] = (acc[member.membershipName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(membershipTypeData)
    .map(([name, count]) => ({ 
      name: name.length > 15 ? name.slice(0, 15) + '...' : name, 
      fullName: name,
      count 
    }))
    .slice(0, 8);

  const locationData = data.reduce((acc, member) => {
    if (member.location && member.location !== '-') {
      acc[member.location] = (acc[member.location] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const locationBarData = Object.entries(locationData)
    .map(([name, count]) => ({ name, count }))
    .slice(0, 6);

  // Trend data - mock monthly data
  const trendData = [
    { month: 'Jan', active: 120, expired: 25, new: 35 },
    { month: 'Feb', active: 135, expired: 28, new: 42 },
    { month: 'Mar', active: 148, expired: 22, new: 38 },
    { month: 'Apr', active: 156, expired: 30, new: 45 },
    { month: 'May', active: 168, expired: 26, new: 52 },
    { month: 'Jun', active: 185, expired: 24, new: 48 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-slate-200 rounded-xl shadow-xl">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartButtons = [
    { key: 'status', label: 'Status', icon: Users, color: 'bg-blue-500' },
    { key: 'types', label: 'Types', icon: BarChart3, color: 'bg-emerald-500' },
    { key: 'locations', label: 'Locations', icon: MapPin, color: 'bg-purple-500' },
    { key: 'trends', label: 'Trends', icon: TrendingUp, color: 'bg-orange-500' }
  ] as const;

  const renderChart = () => {
    switch (activeChart) {
      case 'status':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'types':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748B"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#64748B" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'locations':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={locationBarData} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" stroke="#64748B" />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#64748B"
                fontSize={12}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'trends':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64738B" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="active" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="monotone" dataKey="expired" stroke="#EF4444" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="monotone" dataKey="new" stroke="#F59E0B" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const getChartStats = () => {
    const totalMembers = data.length;
    const activeMembers = data.filter(m => m.status === 'Active').length;
    const totalSessions = data.reduce((sum, m) => sum + m.sessionsLeft, 0);
    const avgSessions = Math.round(totalSessions / totalMembers);

    return [
      { label: 'Total Members', value: totalMembers, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Active Rate', value: `${Math.round((activeMembers / totalMembers) * 100)}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Total Sessions', value: totalSessions, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Avg Sessions', value: avgSessions, color: 'text-orange-600', bg: 'bg-orange-50' }
    ];
  };

  return (
    <Card className="bg-white border-2 border-slate-100 shadow-xl">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            Analytics Dashboard
          </h3>
          <div className="flex gap-2">
            {chartButtons.map((button) => (
              <Button
                key={button.key}
                variant={activeChart === button.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveChart(button.key)}
                className={`${activeChart === button.key 
                  ? `${button.color} text-white shadow-lg scale-105` 
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                } transition-all duration-200 font-semibold`}
              >
                <button.icon className="h-4 w-4 mr-2" />
                {button.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {getChartStats().map((stat, index) => (
            <div key={index} className={`${stat.bg} p-4 rounded-xl border border-slate-200`}>
              <p className="text-sm font-semibold text-slate-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
          {renderChart()}
        </div>
      </div>
    </Card>
  );
};
