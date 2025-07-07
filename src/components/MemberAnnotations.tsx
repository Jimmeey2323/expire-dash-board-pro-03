import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Save, Calendar as CalendarIcon, Trash2, FileText, Tag, Clock, User, MessageSquare, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MembershipData } from "@/types/membership";
import { googleSheetsService } from "@/services/googleSheets";
import { toast } from "sonner";

interface DateNote {
  id: string;
  date: Date;
  note: string;
  type: 'comment' | 'internal' | 'follow-up';
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
  const [noteDate, setNoteDate] = useState<Date>(new Date());
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when member changes
  useEffect(() => {
    if (member) {
      setComments(member.comments || '');
      setNotes(member.notes || '');
      setTags(member.tags || []);
      
      // Initialize with one date note if none exist
      if (dateNotes.length === 0) {
        setDateNotes([{
          id: '1',
          date: member.noteDate ? new Date(member.noteDate) : new Date(),
          note: member.comments || '',
          type: 'comment'
        }]);
      }
      
      // Set note date
      if (member.noteDate) {
        try {
          const existingDate = new Date(member.noteDate);
          if (!isNaN(existingDate.getTime())) {
            setNoteDate(existingDate);
          } else {
            setNoteDate(new Date());
          }
        } catch (error) {
          setNoteDate(new Date());
        }
      } else {
        setNoteDate(new Date());
      }
    }
  }, [member]);

  const addDateNote = () => {
    const newDateNote: DateNote = {
      id: Date.now().toString(),
      date: new Date(),
      note: '',
      type: 'comment'
    };
    setDateNotes([...dateNotes, newDateNote]);
  };

  const updateDateNote = (id: string, field: keyof DateNote, value: any) => {
    setDateNotes(prev => prev.map(note => 
      note.id === id ? { ...note, [field]: value } : note
    ));
  };

  const removeDateNote = (id: string) => {
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
      const noteDateString = noteDate.toISOString();
      
      // Combine all date notes into comments and notes
      const allComments = dateNotes
        .filter(note => note.type === 'comment' && note.note.trim())
        .map(note => `[${format(note.date, 'MMM dd, yyyy')}] ${note.note}`)
        .join('\n');
      
      const allNotes = dateNotes
        .filter(note => note.type === 'internal' && note.note.trim())
        .map(note => `[${format(note.date, 'MMM dd, yyyy')}] ${note.note}`)
        .join('\n');
      
      const finalComments = [comments, allComments].filter(Boolean).join('\n');
      const finalNotes = [notes, allNotes].filter(Boolean).join('\n');
      
      // Use unique ID from column A as primary key
      await googleSheetsService.saveAnnotation(
        member.uniqueId,  // Use unique ID from column A
        member.memberId,
        member.email,
        finalComments,
        finalNotes,
        tags,
        noteDateString
      );
      
      onSave(member.memberId, finalComments, finalNotes, tags, noteDateString);
      
      toast.success("Notes and tags saved successfully!");
      onClose();
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error("Failed to save annotations. Please try again.");
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
      setDateNotes([{
        id: '1',
        date: member.noteDate ? new Date(member.noteDate) : new Date(),
        note: member.comments || '',
        type: 'comment'
      }]);
      if (member.noteDate) {
        try {
          const existingDate = new Date(member.noteDate);
          if (!isNaN(existingDate.getTime())) {
            setNoteDate(existingDate);
          } else {
            setNoteDate(new Date());
          }
        } catch (error) {
          setNoteDate(new Date());
        }
      } else {
        setNoteDate(new Date());
      }
    }
    onClose();
  };

  if (!member) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'internal': return <StickyNote className="h-4 w-4" />;
      case 'follow-up': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/30 to-purple-50/50 rounded-lg" />
        <div className="relative z-10 h-full flex flex-col">
          <DialogHeader className="pb-4 border-b border-white/20">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Member Notes & Details
                </div>
                <div className="text-sm font-normal text-slate-600 mt-1">
                  {member.firstName} {member.lastName} • ID: {member.memberId}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="overview" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-white/50 gap-1 p-1 mb-4">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-medium text-sm"
                >
                  <User className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white font-medium text-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger 
                  value="tags" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white font-medium text-sm"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Tags
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white font-medium text-sm"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <TabsContent value="overview" className="mt-0 space-y-4">
                  {/* Member Information Card */}
                  <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Member Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</Label>
                        <p className="font-medium text-slate-800">{member.firstName} {member.lastName}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</Label>
                        <p className="text-sm text-slate-700">{member.email}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Member ID</Label>
                        <p className="font-mono text-sm font-bold text-slate-800">{member.memberId}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Membership</Label>
                        <p className="text-sm text-slate-700">{member.membershipName}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</Label>
                        <p className="text-sm text-slate-700">{member.location}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</Label>
                        <Badge 
                          className={cn(
                            "w-fit h-6 flex items-center justify-center font-semibold text-xs",
                            member.status === 'Active' 
                              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg' 
                              : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                          )}
                        >
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Membership Details Card */}
                  <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      Membership Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-12">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</Label>
                        <p className="text-sm text-slate-700">{new Date(member.orderDate).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</Label>
                        <p className="text-sm text-slate-700">{new Date(member.endDate).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sessions Left</Label>
                        <Badge 
                          className={cn(
                            "w-fit h-6 flex items-center justify-center font-bold text-xs",
                            member.sessionsLeft > 5 
                              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white" 
                              : member.sessionsLeft > 0 
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" 
                                : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                          )}
                        >
                          {member.sessionsLeft}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sold By</Label>
                        <p className="text-sm text-slate-700">{member.soldBy || 'N/A'}</p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="mt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
                      <Label className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        Customer Comments
                      </Label>
                      <Textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add customer feedback, preferences, or public notes..."
                        className="min-h-[120px] bg-white/50 border-white/30 backdrop-blur-sm resize-none"
                        rows={5}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Customer-facing notes and feedback
                      </p>
                    </Card>

                    <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
                      <Label className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <StickyNote className="h-5 w-5 text-purple-600" />
                        Internal Notes
                      </Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add internal staff notes, follow-up actions..."
                        className="min-h-[120px] bg-white/50 border-white/30 backdrop-blur-sm resize-none"
                        rows={5}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Internal staff notes and administrative information
                      </p>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="tags" className="mt-0">
                  <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
                    <Label className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-green-600" />
                      Member Tags
                    </Label>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a new tag (e.g., VIP, Renewal Due, Special Needs)..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 bg-white/50 border-white/30 backdrop-blur-sm"
                        />
                        <Button 
                          onClick={handleAddTag} 
                          size="sm" 
                          disabled={!newTag.trim()}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {tags.length > 0 && (
                        <div className="space-y-3">
                          <Separator className="bg-white/30" />
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                              <Badge 
                                key={index} 
                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                                <button
                                  onClick={() => handleRemoveTag(tag)}
                                  className="ml-1 hover:bg-white/20 rounded-full p-1 transition-colors"
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="timeline" className="mt-0">
                  <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <Label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        Date-Specific Notes
                      </Label>
                      <Button 
                        onClick={addDateNote} 
                        size="sm" 
                        className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>

                    <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                      {dateNotes.map((dateNote, index) => (
                        <Card key={dateNote.id} className="p-4 bg-white/80 backdrop-blur-sm border-white/30 shadow-md">
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal bg-white/50 border-white/30"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {format(dateNote.date, "PPP")}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-xl" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={dateNote.date}
                                      onSelect={(date) => date && updateDateNote(dateNote.id, 'date', date)}
                                      initialFocus
                                      className="rounded-md border-0"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div className="flex-1">
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Type</Label>
                                <select
                                  value={dateNote.type}
                                  onChange={(e) => updateDateNote(dateNote.id, 'type', e.target.value)}
                                  className="w-full p-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-sm"
                                >
                                  <option value="comment">Customer Comment</option>
                                  <option value="internal">Internal Note</option>
                                  <option value="follow-up">Follow-up Required</option>
                                </select>
                              </div>

                              {dateNotes.length > 1 && (
                                <Button
                                  onClick={() => removeDateNote(dateNote.id)}
                                  size="sm"
                                  variant="outline"
                                  className="mt-6 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                {getTypeIcon(dateNote.type)}
                                Note Content
                              </Label>
                              <Textarea
                                value={dateNote.note}
                                onChange={(e) => updateDateNote(dateNote.id, 'note', e.target.value)}
                                placeholder={`Add ${dateNote.type} note...`}
                                className="min-h-[80px] bg-white/50 border-white/30 backdrop-blur-sm resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/20 mt-4">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isSaving}
              className="border-white/30 bg-white/50 backdrop-blur-sm hover:bg-white/70"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save All Notes
                </div>
              )}
            </Button>
          </div>

          {/* Persistence Info */}
          <Card className="p-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border-blue-200/30 shadow-lg mt-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md shadow-lg">
                <Save className="h-3 w-3" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-900">Automatic Data Persistence</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  All notes and tags are automatically saved and will persist through data refreshes.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};