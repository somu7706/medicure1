import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import {
  FileText,
  Calendar,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  Upload,
  Bot,
  Search,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const History = () => {
  const { t } = useTranslation();
  const { api, refreshUser } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState('upload'); // 'upload' or 'chat'
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('uploads');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [uploadsRes, chatRes] = await Promise.all([
          api.get('/uploads'),
          api.get('/chat/history')
        ]);
        setUploads(uploadsRes.data.items || []);
        setChatHistory(chatRes.data.items || []);
      } catch (err) {
        console.error('Failed to fetch history:', err);
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [api]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      if (deleteType === 'upload') {
        await api.delete(`/uploads/${deleteId}`);
        setUploads(prev => prev.filter(u => u.id !== deleteId));
        toast.success('Upload deleted');
      } else {
        await api.delete(`/chat/history/${deleteId}`);
        setChatHistory(prev => prev.filter(c => c.id !== deleteId));
        toast.success('Conversation record deleted');
      }
      await refreshUser();
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const clearAllChatRecords = async () => {
    if (window.confirm('Delete all AI Assistant chat records? This cannot be undone.')) {
      setLoading(true);
      try {
        await api.delete('/chat/history');
        setChatHistory([]);
        toast.success('All chat records cleared');
      } catch (err) {
        toast.error('Failed to clear records');
      } finally {
        setLoading(false);
      }
    }
  };

  const getDocTypeConfig = (type) => {
    const configs = {
      prescription: { icon: '💊', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      lab_report: { icon: '🧪', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      xray: { icon: '📷', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      wound: { icon: '🩹', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      discharge: { icon: '📋', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      link: { icon: '🔗', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
      unknown: { icon: '📄', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
    };
    return configs[type] || configs.unknown;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="history-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('nav.history')}</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your health records
          </p>
        </div>
        <Link to="/upload">
          <Button className="rounded-full" data-testid="new-upload-btn">
            <Upload className="h-4 w-4 mr-2" />
            New Upload
          </Button>
        </Link>
      </div>

      {/* Tabs and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabsList className="grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger value="uploads">Documents</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-full"
              />
            </div>
            {activeTab === 'assistant' && chatHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllChatRecords} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full px-4">
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Uploads History */}
        <TabsContent value="uploads" className="mt-0 outline-none">
          {uploads.filter(u => u.filename.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
            <div className="grid gap-4">
              {uploads
                .filter(u => u.filename.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((upload) => {
                  const config = getDocTypeConfig(upload.doc_type);
                  return (
                    <Card key={upload.id} className="glass-panel border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-medium text-foreground truncate">{upload.filename}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={config.color}>{upload.doc_type}</Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(upload.created_at)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedUpload(upload)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh]">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <span className="text-2xl">{config.icon}</span>
                                        {upload.filename}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <ScrollArea className="max-h-[60vh]">
                                      <div className="space-y-4 p-1">
                                        {upload.summary_short?.length > 0 && (
                                          <div>
                                            <h4 className="font-medium mb-2">Summary</h4>
                                            <ul className="space-y-1">
                                              {upload.summary_short.map((item, i) => (
                                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                  <span className="text-primary mt-1">•</span>{item}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {upload.summary_detailed && (
                                          <div>
                                            <h4 className="font-medium mb-2">Details</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{upload.summary_detailed}</p>
                                          </div>
                                        )}
                                      </div>
                                    </ScrollArea>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="icon" onClick={() => { setDeleteId(upload.id); setDeleteType('upload'); }} className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border/50">
              <p className="text-muted-foreground">No documents found matching your search.</p>
            </div>
          )}
        </TabsContent>

        {/* AI Assistant History */}
        <TabsContent value="assistant" className="mt-0 outline-none">
          {chatHistory.filter(c => c.message.toLowerCase().includes(searchQuery.toLowerCase()) || c.response.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
            <div className="grid gap-4">
              {chatHistory
                .filter(c => c.message.toLowerCase().includes(searchQuery.toLowerCase()) || c.response.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((chat) => (
                  <Card key={chat.id} className="glass-panel border-border/50 overflow-hidden group">
                    <CardContent className="p-0">
                      <div className="flex gap-4 p-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{chat.message}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{chat.response}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(chat.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => { setDeleteId(chat.id); setDeleteType('chat'); }} className="text-destructive hover:text-destructive h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Link to="/assistant">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border/50">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No chat history found matching your search.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Global Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this {deleteType === 'upload' ? 'document' : 'conversation record'}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
