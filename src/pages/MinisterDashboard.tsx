import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { lettersAPI, Letter } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, FileText, LogOut, Plus, Send, Inbox, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Logo from '@/components/ui/logo';

const MinisterDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [sentLetters, setSentLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [view, setView] = useState<'inbox' | 'sent' | 'create'>('inbox');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLetter, setNewLetter] = useState({
    subject: '',
    description: '',
    document: null as File | null,
    requires_minister: false
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      const data = await lettersAPI.getInbox();
      setLetters(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch letters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSentLetters = async () => {
    try {
      const data = await lettersAPI.getSent();
      setSentLetters(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sent letters",
        variant: "destructive",
      });
    }
  };

  const handleCreateLetter = async () => {
    if (!newLetter.subject.trim() || !newLetter.document) {
      toast({
        title: "Error",
        description: "Please fill in subject and upload a document",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      await lettersAPI.create({
        subject: newLetter.subject,
        description: newLetter.description,
        document: newLetter.document!,
        requires_minister: newLetter.requires_minister
      });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      setNewLetter({ subject: '', description: '', document: null, requires_minister: false });
      setShowCreateForm(false);
      fetchSentLetters(); // Refresh sent letters
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleViewChange = (newView: 'inbox' | 'sent' | 'create') => {
    setView(newView);
    if (newView === 'sent') {
      fetchSentLetters();
    }
  };

  const handleDecision = async (letterId: number, decision: 'approved' | 'rejected') => {
    setProcessingId(letterId);
    try {
      await lettersAPI.ministerDecision(letterId, decision);
      toast({
        title: "Success",
        description: `Letter ${decision} successfully`,
      });
      fetchLetters();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${decision} letter`,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      needs_minister_approval: { label: 'Pending Approval', variant: 'secondary' as const },
      minister_approved: { label: 'Approved', variant: 'default' as const },
      minister_rejected: { label: 'Rejected', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? (
      <Badge variant={config.variant}>{config.label}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
             <header className="bg-white shadow-sm border-b">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center py-4">
             <div className="flex items-center space-x-4">
               <Logo size="md" />
               <div>
                 <h1 className="text-2xl font-bold text-gray-900">Minister Dashboard</h1>
                 <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
               </div>
             </div>
            <div className="flex items-center space-x-4">
                             <Button onClick={() => handleViewChange('create')} className="bg-blue-600 hover:bg-blue-700">
                 <Plus className="h-4 w-4 mr-2" />
                 Upload Document
               </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-t pt-4">
            <button
              onClick={() => handleViewChange('inbox')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                view === 'inbox'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Inbox className="h-4 w-4 inline mr-2" />
              Letters for Approval
            </button>
            <button
              onClick={() => handleViewChange('sent')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                view === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              Sent Letters
            </button>
                         <button
               onClick={() => handleViewChange('create')}
               className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                 view === 'create'
                   ? 'border-blue-500 text-blue-600'
                   : 'border-transparent text-blue-500 hover:text-blue-700 hover:border-blue-300'
               }`}
             >
               <Plus className="h-4 w-4 inline mr-2" />
               Upload Document
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats - Only show on inbox view */}
        {view === 'inbox' && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {letters.filter(l => l.status === 'needs_minister_approval').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {letters.filter(l => l.status === 'minister_approved' && 
                      new Date(l.minister_decided_at || '').toDateString() === new Date().toDateString()).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Letters</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{letters.length}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Inbox View - Letters Requiring Approval */}
        {view === 'inbox' && (
          <Card>
            <CardHeader>
              <CardTitle>Letters Requiring Approval</CardTitle>
              <CardDescription>
                Review and approve or reject letters that require ministerial approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {letters.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No letters to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {letters.map((letter) => (
                    <div key={letter.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{letter.subject}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            From Department ID: {letter.from_department_id}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(letter.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(letter.status)}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        {letter.description && (
                          <p className="text-gray-700 mb-3">{letter.description}</p>
                        )}
                        {letter.document_name && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">{letter.document_name}</p>
                                <p className="text-xs text-blue-600">
                                  {letter.document_type} • {(letter.document_size! / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {letter.status === 'needs_minister_approval' && (
                        <>
                          <Separator className="my-4" />
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => handleDecision(letter.id, 'approved')}
                              disabled={processingId === letter.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDecision(letter.id, 'rejected')}
                              disabled={processingId === letter.id}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </>
                      )}

                      {letter.minister_decided_at && (
                        <div className="mt-4 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600">
                            Decision made on: {new Date(letter.minister_decided_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sent Letters View */}
        {view === 'sent' && (
          <Card>
            <CardHeader>
              <CardTitle>Sent Letters</CardTitle>
              <CardDescription>
                View all letters you have created
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentLetters.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No sent letters yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentLetters.map((letter) => (
                    <div key={letter.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{letter.subject}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Status: {letter.status}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(letter.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(letter.status)}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        {letter.description && (
                          <p className="text-gray-700 mb-3">{letter.description}</p>
                        )}
                        {letter.document_name && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">{letter.document_name}</p>
                                <p className="text-xs text-blue-600">
                                  {letter.document_type} • {(letter.document_size! / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Letter View */}
        {view === 'create' && (
          <Card>
                      <CardHeader>
            <CardTitle>Upload New Document</CardTitle>
            <CardDescription>
              Upload and send a new document (PDF, DOC, DOCX)
            </CardDescription>
          </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter letter subject"
                    value={newLetter.subject}
                    onChange={(e) => setNewLetter({ ...newLetter, subject: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter a brief description of the document..."
                    rows={3}
                    value={newLetter.description}
                    onChange={(e) => setNewLetter({ ...newLetter, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">Upload Document</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="document"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setNewLetter({ ...newLetter, document: e.target.files?.[0] || null })}
                      className="hidden"
                    />
                    <label htmlFor="document" className="cursor-pointer">
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-blue-600 hover:text-blue-500">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </div>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                      </div>
                    </label>
                  </div>
                  {newLetter.document && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        <FileText className="h-4 w-4 inline mr-2" />
                        {newLetter.document.name} ({(newLetter.document.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires_minister"
                    checked={newLetter.requires_minister}
                    onChange={(e) => setNewLetter({ ...newLetter, requires_minister: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="requires_minister">Requires Minister Approval</Label>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleCreateLetter}
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {creating ? 'Uploading...' : 'Upload Document'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNewLetter({ subject: '', description: '', document: null, requires_minister: false })}
                  >
                    Clear Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MinisterDashboard;