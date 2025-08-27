import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { lettersAPI, departmentsAPI, Letter, Department } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Send, Inbox, Clock, CheckCircle, XCircle, LogOut, Plus, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/ui/logo';

const DepartmentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [inboxLetters, setInboxLetters] = useState<Letter[]>([]);
  const [sentLetters, setSentLetters] = useState<Letter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [newLetter, setNewLetter] = useState({
    subject: '',
    body: '',
    requires_minister: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inboxData, sentData, departmentsData] = await Promise.all([
        lettersAPI.getInbox(),
        lettersAPI.getSent(),
        departmentsAPI.getAll()
      ]);
      setInboxLetters(inboxData);
      setSentLetters(sentData);
      setDepartments(departmentsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComposeLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposing(true);
    
    try {
      await lettersAPI.create(newLetter);
      toast({
        title: "Success",
        description: "Letter sent to Record Office for review",
      });
      setNewLetter({ subject: '', body: '', requires_minister: false });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send letter",
        variant: "destructive",
      });
    } finally {
      setComposing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_review: { label: 'Under Review', variant: 'secondary' as const, icon: Clock },
      needs_minister_approval: { label: 'With Minister', variant: 'default' as const, icon: Clock },
      minister_approved: { label: 'Minister Approved', variant: 'default' as const, icon: CheckCircle },
      minister_rejected: { label: 'Minister Rejected', variant: 'destructive' as const, icon: XCircle },
      forwarded: { label: 'Forwarded', variant: 'outline' as const, icon: Send },
      delivered: { label: 'Delivered', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getDepartmentName = (id: number) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : `Department ${id}`;
  };

  const currentDepartment = departments.find(d => d.id === user?.department_id);

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
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentDepartment?.name || 'Department'} Dashboard
                </h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Compose Letter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Compose New Letter</DialogTitle>
                    <DialogDescription>
                      Create a new letter to be reviewed by the Record Office
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleComposeLetter} className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={newLetter.subject}
                        onChange={(e) => setNewLetter({ ...newLetter, subject: e.target.value })}
                        placeholder="Enter letter subject"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="body">Message</Label>
                      <Textarea
                        id="body"
                        value={newLetter.body}
                        onChange={(e) => setNewLetter({ ...newLetter, body: e.target.value })}
                        placeholder="Enter your message"
                        rows={6}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requires_minister"
                        checked={newLetter.requires_minister}
                        onCheckedChange={(checked) => setNewLetter({ ...newLetter, requires_minister: checked })}
                      />
                      <Label htmlFor="requires_minister">Requires Minister Approval</Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={composing}>
                        {composing ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Letter
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inbox</CardTitle>
                <Inbox className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inboxLetters.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sent</CardTitle>
                <Send className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sentLetters.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sentLetters.filter(l => ['pending_review', 'needs_minister_approval'].includes(l.status)).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sentLetters.filter(l => l.status === 'delivered').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="inbox" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Inbox ({inboxLetters.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Sent ({sentLetters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            <Card>
              <CardHeader>
                <CardTitle>Inbox</CardTitle>
                <CardDescription>
                  Letters received by your department
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inboxLetters.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No letters in your inbox</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inboxLetters.map((letter) => (
                      <div key={letter.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{letter.subject}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              From: {getDepartmentName(letter.from_department_id)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Received: {new Date(letter.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(letter.status)}
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-gray-700 whitespace-pre-wrap">{letter.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card>
              <CardHeader>
                <CardTitle>Sent Letters</CardTitle>
                <CardDescription>
                  Letters sent by your department
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sentLetters.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No letters sent yet</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Compose Your First Letter
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Compose New Letter</DialogTitle>
                          <DialogDescription>
                            Create a new letter to be reviewed by the Record Office
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleComposeLetter} className="space-y-4">
                          <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                              id="subject"
                              value={newLetter.subject}
                              onChange={(e) => setNewLetter({ ...newLetter, subject: e.target.value })}
                              placeholder="Enter letter subject"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="body">Message</Label>
                            <Textarea
                              id="body"
                              value={newLetter.body}
                              onChange={(e) => setNewLetter({ ...newLetter, body: e.target.value })}
                              placeholder="Enter your message"
                              rows={6}
                              required
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="requires_minister"
                              checked={newLetter.requires_minister}
                              onCheckedChange={(checked) => setNewLetter({ ...newLetter, requires_minister: checked })}
                            />
                            <Label htmlFor="requires_minister">Requires Minister Approval</Label>
                          </div>
                          <div className="flex space-x-2">
                            <Button type="submit" disabled={composing}>
                              {composing ? (
                                <>
                                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Letter
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentLetters.map((letter) => (
                      <div key={letter.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{letter.subject}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              To: {letter.to_department_id ? getDepartmentName(letter.to_department_id) : 'Pending Assignment'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Sent: {new Date(letter.created_at).toLocaleDateString()}
                            </p>
                            {letter.requires_minister && (
                              <Badge variant="outline" className="mt-1">
                                Requires Minister Approval
                              </Badge>
                            )}
                          </div>
                          {getStatusBadge(letter.status)}
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">{letter.body}</p>
                        </div>

                        {letter.reviewed_at && (
                          <div className="text-xs text-gray-500 mt-2">
                            Reviewed: {new Date(letter.reviewed_at).toLocaleString()}
                          </div>
                        )}
                        
                        {letter.minister_decided_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Minister Decision: {new Date(letter.minister_decided_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DepartmentDashboard;