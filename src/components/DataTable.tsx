import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Search, ArrowUpDown, MessageSquare, FileText, Eye, TrendingUp, Calendar } from "lucide-react";
import { MembershipData } from "@/types/membership";
import { MemberAnnotations } from "./MemberAnnotations";
import { cn } from "@/lib/utils";

interface DataTableProps {
  data: MembershipData[];
  title: string;
  className?: string;
  onAnnotationUpdate?: (memberId: string, comments: string, notes: string, tags: string[]) => void;
}

type SortField = keyof MembershipData;
type SortDirection = 'asc' | 'desc';

export const DataTable = ({
  data,
  title,
  className = '',
  onAnnotationUpdate
}: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<MembershipData | null>(null);
  const [isAnnotationOpen, setIsAnnotationOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const itemsPerPage = 15;

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString || dateString === '-' || dateString === '') return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => Object.values(item).some(value => value.toString().toLowerCase().includes(searchTerm.toLowerCase())));
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const toggleRowExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedRows(newExpanded);
  };

  const handleOpenAnnotations = (member: MembershipData) => {
    setSelectedMember(member);
    setIsAnnotationOpen(true);
  };

  const handleAnnotationSave = (memberId: string, comments: string, notes: string, tags: string[], noteDate: string) => {
    if (onAnnotationUpdate) {
      onAnnotationUpdate(memberId, comments, notes, tags);
    }
    setIsAnnotationOpen(false);
    setSelectedMember(null);
  };

  const getDaysUntilExpiry = (endDate: string) => {
    if (!endDate || endDate === '-') return null;
    
    try {
      const today = new Date();
      const expiry = new Date(endDate);
      if (isNaN(expiry.getTime())) return null;
      
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  return (
    <>
      <TooltipProvider>
        <Card className={`bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl ${className}`}>
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                {title}
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input 
                    placeholder="Search members..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="pl-12 pr-4 py-3 bg-white/50 border-white/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl w-80 transition-all duration-200 backdrop-blur-sm" 
                  />
                </div>
                <Badge 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 text-sm font-semibold border-0 shadow-lg"
                >
                  {filteredAndSortedData.length} records
                </Badge>
              </div>
            </div>

            <div className="border-2 border-white/20 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm shadow-xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50/80 to-slate-100/80 border-b-2 border-white/30 h-12 backdrop-blur-sm">
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('memberId')}>
                        Member ID {getSortIcon('memberId')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('firstName')}>
                        Name {getSortIcon('firstName')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">Email</TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('membershipName')}>
                        Membership {getSortIcon('membershipName')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('endDate')}>
                        Expiry {getSortIcon('endDate')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">Location</TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('sessionsLeft')}>
                        Sessions {getSortIcon('sessionsLeft')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12 text-center">
                      <Button variant="ghost" className="h-auto p-0 font-bold text-slate-700 hover:text-blue-600" onClick={() => handleSort('status')}>
                        Status {getSortIcon('status')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">Tags</TableHead>
                    <TableHead className="text-slate-700 font-bold h-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map(member => {
                    const daysUntilExpiry = getDaysUntilExpiry(member.endDate);
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                    const isExpanded = expandedRows.has(member.memberId);
                    
                    return (
                      <>
                        <TableRow key={member.uniqueId} className="border-b border-white/20 hover:bg-white/30 transition-all duration-150 h-10 backdrop-blur-sm" style={{ height: '40px' }}>
                          <TableCell className="text-slate-800 font-mono text-sm h-10 py-2">{member.memberId}</TableCell>
                          <TableCell className="text-slate-800 font-medium h-10 py-2 min-w-52">
                            <div className="flex items-center gap-2">
                              {member.firstName} {member.lastName}
                              <Button variant="ghost" size="sm" onClick={() => toggleRowExpansion(member.memberId)} className="h-6 w-6 p-0 hover:bg-blue-100">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 h-10 py-2 min-w-52">{member.email}</TableCell>
                          <TableCell className="text-slate-600 h-10 py-2 min-w-64">
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="max-w-64">
                                  {member.membershipName}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{member.membershipName}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-slate-600 h-10 py-2 min-w-36">
                            <div className="flex items-center gap-2">
                              <span>{formatDisplayDate(member.endDate)}</span>
                              {isExpiringSoon && daysUntilExpiry !== null && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                                      {daysUntilExpiry}d
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Expires in {daysUntilExpiry} days</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 h-10 py-2 min-w-64">{member.location}</TableCell>
                          <TableCell className="text-center h-10 py-2">
                            <Badge 
                              className={cn(
                                "w-16 h-7 flex items-center justify-center font-bold text-xs border-0 shadow-lg",
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
                          <TableCell className="h-10 py-2">
                            <Badge 
                              className={cn(
                                "w-40 h-7 flex items-center justify-center font-bold text-xs border-0 shadow-lg px-4",
                                member.status === 'Active' 
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                              )}
                            >
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="h-10 py-2">
                            <div className="flex flex-wrap gap-1">
                              {member.tags?.slice(0, 2).map((tag, index) => 
                                <Badge 
                                  key={index} 
                                  className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-md"
                                >
                                  {tag}
                                </Badge>
                              )}
                              {member.tags && member.tags.length > 2 && 
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge className="text-xs bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-md">
                                      +{member.tags.length - 2}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      {member.tags.slice(2).map((tag, index) => 
                                        <div key={index} className="text-xs">{tag}</div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              }
                            </div>
                          </TableCell>
                          <TableCell className="h-10 py-2">
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleOpenAnnotations(member)} 
                                    className="h-8 w-8 p-0 hover:bg-blue-100 bg-white/50 backdrop-blur-sm"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Add notes & tags</p>
                                </TooltipContent>
                              </Tooltip>
                              {(member.comments || member.notes) && 
                                <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mt-3 shadow-lg" title="Has annotations" />
                              }
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {isExpanded && (
                          <TableRow className="bg-white/40 border-b border-white/20 backdrop-blur-sm">
                            <TableCell colSpan={10} className="p-6">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Order Details
                                  </h4>
                                  <p className="text-sm text-slate-600">Order Date: {formatDisplayDate(member.orderDate)}</p>
                                  <p className="text-sm text-slate-600">Start Date: {formatDisplayDate(member.startDate || member.orderDate)}</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Activity
                                  </h4>
                                  <p className="text-sm text-slate-600">Sessions Used: {(member.totalSessions || 0) - member.sessionsLeft}</p>
                                  <p className="text-sm text-slate-600">Total Sessions: {member.totalSessions || 'N/A'}</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-slate-700">Contact</h4>
                                  <p className="text-sm text-slate-600">Phone: {member.phone || 'N/A'}</p>
                                  <p className="text-sm text-slate-600">Address: {member.address || 'N/A'}</p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-slate-700">Notes</h4>
                                  <p className="text-sm text-slate-600">{member.comments || member.notes || 'No notes available'}</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && 
              <div className="flex items-center justify-between mt-8 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/30 shadow-lg">
                <p className="text-slate-600 text-sm font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                    disabled={currentPage === 1} 
                    className="border-white/30 hover:bg-white/70 bg-white/50 backdrop-blur-sm"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-3 py-1 bg-white/70 border border-white/30 rounded text-sm font-medium backdrop-blur-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                    disabled={currentPage === totalPages} 
                    className="border-white/30 hover:bg-white/70 bg-white/50 backdrop-blur-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            }
          </div>
        </Card>
      </TooltipProvider>

      <MemberAnnotations 
        member={selectedMember} 
        isOpen={isAnnotationOpen} 
        onClose={() => {
          setIsAnnotationOpen(false);
          setSelectedMember(null);
        }} 
        onSave={handleAnnotationSave} 
      />
    </>
  );
};