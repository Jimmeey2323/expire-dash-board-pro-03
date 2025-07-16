import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  X, 
  Plus, 
  Save, 
  Calendar as CalendarIcon, 
  Trash2, 
  FileText, 
  Tag, 
  Clock, 
  User, 
  MessageSquare, 
  StickyNote,
  Phone,
  MapPin,
  CreditCard,
  Activity,
  Shield,
  Star,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Edit3,
  Archive
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MembershipData } from "@/types/membership";
import { googleSheetsService } from "@/services/googleSheets";
import { toast } from "sonner";

interface DateNote {
  id: string;
  date: Date;
  note: string;
  type: 'customer' | 'internal' | 'follow-up';
  title: string;
}

interface MemberAnnotationsProps {
  member: MembershipData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string, comments: string, notes: string, tags: string[], noteDate: string) => void;
}

export const MemberAnnotations = ({ member, isOpen, onClose, onSave }: MemberAnnotationsProps) => {
  const [comments, setComments] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dateNotes, setDateNotes] = useState<DateNote[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize form data when member changes
  useEffect(() => {
    if (member) {
      setComments(member.comments || '');
      setNotes(member.notes || '');
      setTags(member.tags || []);
      
      // Initialize with existing notes or create empty array
      if (member.comments || member.notes) {
        const initialNotes: DateNote[] = [];
        
        if (member.comments) {
          initialNotes.push({
            id: 'comment-1',
            date: member.noteDate ? new Date(member.noteDate) : new Date(),
            note: member.comments,
            type: 'customer',
            title: 'Customer Feedback'
          });
        }
        
        if (member.notes) {
          initialNotes.push({
            id: 'note-1',
            date: member.noteDate ? new Date(member.noteDate) : new Date(),
            note: member.notes,
            type: 'internal',
            title: 'Internal Note'
          });
        }
        
        setDateNotes(initialNotes);
      } else {
        setDateNotes([]);
      }
    }
  }, [member]);

  const addNewNote = (type: 'customer' | 'internal' | 'follow-up') => {
    const newNote: DateNote = {
      id: `${type}-${Date.now()}`,
      date: new Date(),
      note: '',
      type,
      title: type === 'customer' ? 'Customer Note' : type === 'internal' ? 'Internal Note' : 'Follow-up Required'
    };
    setDateNotes([...dateNotes, newNote]);
  };

  const updateNote = (id: string, field: keyof DateNote, value: any) => {
    setDateNotes(prev => prev.map(note => 
      note.id === id ? { ...note, [field]: value } : note
    ));
  };

  const removeNote = (id: string) => {
    setDateNotes(prev => prev.filter(note => note.id !== id));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!member) return;
    
    setIsSaving(true);
    try {
      // Combine all notes by type
      const customerNotes = dateNotes
        .filter(note => note.type === 'customer' && note.note.trim())
        .map(note => `[${format(note.date, 'MMM dd, yyyy')}] ${note.title}: ${note.note}`)
        .join('\n');
      
      const internalNotes = dateNotes
        .filter(note => note.type === 'internal' && note.note.trim())
        .map(note => `[${format(note.date, 'MMM dd, yyyy')}] ${note.title}: ${note.note}`)
        .join('\n');
      
      const followUpNotes = dateNotes
        .filter(note => note.type === 'follow-up' && note.note.trim())
        .map(note => `[${format(note.date, 'MMM dd, yyyy')}] ${note.title}: ${note.note}`)
        .join('\n');
      
      const allComments = [comments, customerNotes].filter(Boolean).join('\n');
      const allNotes = [notes, internalNotes, followUpNotes].filter(Boolean).join('\n');
      
      const noteDate = new Date().toISOString();
      
      // Save using unique ID as primary key
      await googleSheetsService.saveAnnotation(
        member.uniqueId,
        member.memberId,
        member.email,
        allComments,
        allNotes,
        tags,
        noteDate
      );
      
      onSave(member.memberId, allComments, allNotes, tags, noteDate);
      
      toast.success("Notes and tags saved successfully!", {
        description: "All annotations are securely linked to the member's unique ID."
      });
      onClose();
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error("Failed to save annotations", {
        description: "Please try again or contact support if the issue persists."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleClose = () => {
    if (member) {
      setComments(member.comments || '');
      setNotes(member.notes || '');
      setTags(member.tags || []);
      setDateNotes([]);
    }
    setActiveTab('overview');
    onClose();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'from-blue-500 to-indigo-500';
      case 'internal': return 'from-purple-500 to-pink-500';
      case 'follow-up': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'customer': return <MessageSquare className="h-4 w-4" />;
      case 'internal': return <StickyNote className="h-4 w-4" />;
      case 'follow-up': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const calculateDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!member) return null;

  const daysUntilExpiry = calculateDaysUntilExpiry(member.endDate);
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-white/40 to-purple-50/20" />
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Clean Header */}
          <DialogHeader className="pb-6 border-b border-slate-200/50">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {member.firstName} {member.lastName}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={cn(
                      "px-3 py-1 text-xs font-semibold",
                      member.status === 'Active' 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                        : 'bg-red-100 text-red-700 border-red-300'
                    )}>
                      {member.status}
                    </Badge>
                    {isExpiringSoon && (
                      <Badge className="px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 border-amber-300">
                        Expires in {daysUntilExpiry} days
                      </Badge>
                    )}
                    <span className="text-sm text-slate-600">ID: {member.memberId}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-1 mb-6 shadow-sm border border-slate-200/50">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium"
                >
                  <User className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-medium"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Notes ({dateNotes.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="tags" 
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-medium"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Tags ({tags.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-medium"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 pr-4">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-white/80 border-slate-200/50 shadow-sm">
                      <CardContent className="p-4 text-center">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg w-fit mx-auto mb-2">
                          <Activity className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{member.sessionsLeft}</p>
                        <p className="text-sm text-slate-600">Sessions Left</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 border-slate-200/50 shadow-sm">
                      <CardContent className="p-4 text-center">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg w-fit mx-auto mb-2">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{daysUntilExpiry > 0 ? daysUntilExpiry : 'Expired'}</p>
                        <p className="text-sm text-slate-600">Days Left</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 border-slate-200/50 shadow-sm">
                      <CardContent className="p-4 text-center">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg w-fit mx-auto mb-2">
                          <Tag className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{tags.length}</p>
                        <p className="text-sm text-slate-600">Tags</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 border-slate-200/50 shadow-sm">
                      <CardContent className="p-4 text-center">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg w-fit mx-auto mb-2">
                          <Star className="h-5 w-5" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{member.paid ? 'Paid' : 'Pending'}</p>
                        <p className="text-sm text-slate-600">Payment</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Member Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white/80 border-slate-200/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                          <User className="h-5 w-5 text-blue-600" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm font-medium text-slate-600">Email</span>
                          <span className="text-sm text-slate-900">{member.email}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm font-medium text-slate-600">Phone</span>
                          <span className="text-sm text-slate-900">{member.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm font-medium text-slate-600">Address</span>
                          <span className="text-sm text-slate-900 text-right max-w-48">{member.address || 'Not provided'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 border-slate-200/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                          Membership Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm font-medium text-slate-600">Type</span>
                          <span className="text-sm text-slate-900 text-right max-w-48">{member.membershipName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm font-medium text-slate-600">Location</span>
                          <span className="text-sm text-slate-900">{member.location}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm font-medium text-slate-600">Start Date</span>
                          <span className="text-sm text-slate-900">{formatDate(member.orderDate)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm font-medium text-slate-600">End Date</span>
                          <span className="text-sm text-slate-900">{formatDate(member.endDate)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm font-medium text-slate-600">Total Sessions</span>
                          <span className="text-sm text-slate-900">{member.totalSessions || member.sessionsLeft}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0 space-y-6">
                  {/* Add Note Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={() => addNewNote('customer')} 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer Note
                    </Button>
                    <Button 
                      onClick={() => addNewNote('internal')} 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Internal Note
                    </Button>
                    <Button 
                      onClick={() => addNewNote('follow-up')} 
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Follow-up
                    </Button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-4">
                    {dateNotes.map((note) => (
                      <Card key={note.id} className="bg-white/80 border-slate-200/50 shadow-sm">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg text-white",
                                `bg-gradient-to-r ${getTypeColor(note.type)}`
                              )}>
                                {getTypeIcon(note.type)}
                              </div>
                              <div>
                                <Input
                                  value={note.title}
                                  onChange={(e) => updateNote(note.id, 'title', e.target.value)}
                                  className="font-medium text-slate-900 border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                                  placeholder="Note title..."
                                />
                                <p className="text-xs text-slate-500 capitalize">{note.type} note</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-sm">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    {format(note.date, "MMM dd, yyyy")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <Calendar
                                    mode="single"
                                    selected={note.date}
                                    onSelect={(date) => date && updateNote(note.id, 'date', date)}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <Button
                                onClick={() => removeNote(note.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <Textarea
                            value={note.note}
                            onChange={(e) => updateNote(note.id, 'note', e.target.value)}
                            placeholder={`Add your ${note.type} note here...`}
                            className="min-h-[100px] resize-none border-slate-200 focus:ring-2 focus:ring-blue-500"
                          />
                        </CardContent>
                      </Card>
                    ))}

                    {dateNotes.length === 0 && (
                      <Card className="bg-white/80 border-slate-200/50 shadow-sm">
                        <CardContent className="p-8 text-center">
                          <Edit3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-900 mb-2">No notes yet</h3>
                          <p className="text-slate-600 mb-4">Add your first note using the buttons above</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="tags" className="mt-0">
                  <Card className="bg-white/80 border-slate-200/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <Tag className="h-5 w-5 text-purple-600" />
                        Member Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex gap-3">
                        <Input
                          placeholder="Add a new tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleAddTag} 
                          disabled={!newTag.trim()}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 border-purple-300"
                            >
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:bg-purple-200 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  <Card className="bg-white/80 border-slate-200/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                        <Archive className="h-5 w-5 text-orange-600" />
                        Member History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Alert className="bg-blue-50 border-blue-200">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <strong>Data Persistence:</strong> All notes and tags are linked to Unique ID: {member.uniqueId?.slice(0, 12)}...
                          ensuring they persist even when the main data sheet is refreshed.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200/50 mt-6">
            <div className="text-sm text-slate-600">
              Last updated: {member.noteDate ? format(new Date(member.noteDate), 'PPp') : 'Never'}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};