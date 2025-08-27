import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { lettersAPI, departmentsAPI, Letter, Department, User } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Send, Clock, CheckCircle, XCircle, LogOut, ArrowRight, UserCheck, Users, UserPlus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/ui/logo';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [actionType, setActionType] = useState<'forward' | 'minister' | null>(null);
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'department' as 'minister' | 'record_office' | 'department',
    department_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lettersData, departmentsData, usersData] = await Promise.all([
        lettersAPI.getInbox(),
        departmentsAPI.getAll(),
        fetchUsers()
      ]);
      setLetters(lettersData);
      setDepartments(departmentsData);
      setUsers(usersData);
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          department_id: newUser.department_id ? parseInt(newUser.department_id) : null
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully",
        });
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'department',
          department_id: ''
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: editingUser?.name,
          email: editingUser?.email,
          role: editingUser?.role,
          department_id: editingUser?.department_id
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        setEditingUser(null);
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        setDeletingUser(null);
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleAdminReview = async (letterId: number, action: 'forward' | 'needs_minister', toDepartmentId?: number) => {
    setProcessingId(letterId);
    try {
      await lettersAPI.adminReview(letterId, {
        action,
        to_department_id: toDepartmentId
      });
      toast({
        title: "Success",
        description: action === 'forward' ? "Letter forwarded successfully" : "Letter sent to minister for approval",
      });
      fetchData();
      setCurrentLetter(null);
      setSelectedDepartment('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process letter",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleForward = async (letterId: number, toDepartmentId: number) => {
    setProcessingId(letterId);
    try {
      await lettersAPI.forward(letterId, toDepartmentId);
      toast({
        title: "Success",
        description: "Letter forwarded to department successfully",
      });
      fetchData();
      setCurrentLetter(null);
      setSelectedDepartment('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to forward letter",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_review: { label: 'Pending Review', variant: 'secondary' as const, icon: Clock },
      needs_minister_approval: { label: 'With Minister', variant: 'default' as const, icon: UserCheck },
      minister_approved: { label: 'Minister Approved', variant: 'default' as const, icon: CheckCircle },
      minister_rejected: { label: 'Minister Rejected', variant: 'destructive' as const, icon: XCircle },
      forwarded: { label: 'Forwarded', variant: 'outline' as const, icon: Send },
      delivered: { label: 'Delivered', variant: 'default' as const, icon: CheckCircle },
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

  const pendingReview = letters.filter(l => l.status === 'pending_review');
  const withMinister = letters.filter(l => l.status === 'needs_minister_approval');
  const ministerDecided = letters.filter(l => ['minister_approved', 'minister_rejected'].includes(l.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Logo size="md" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Record Office Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name} - System Administrator</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowUserManagement(!showUserManagement)}
              className="mr-2"
            >
              <Users className="h-4 w-4 mr-2" />
              {showUserManagement ? 'Hide Users' : 'User Management'}
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReview.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Minister</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{withMinister.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Minister Decided</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ministerDecided.length}</div>
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

        <div className="space-y-6">
          {/* Pending Review Section */}
          {pendingReview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Letters Pending Review ({pendingReview.length})
                </CardTitle>
                <CardDescription>
                  Review these letters and decide whether to forward directly or send to minister
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingReview.map((letter) => (
                    <div key={letter.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{letter.subject}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            From: {getDepartmentName(letter.from_department_id)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(letter.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(letter.status)}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">{letter.body}</p>
                      </div>

                      <Separator className="my-4" />
                      <div className="flex space-x-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setCurrentLetter(letter);
                                setActionType('forward');
                              }}
                            >
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Forward Directly
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Forward Letter</DialogTitle>
                              <DialogDescription>
                                Select the department to forward this letter to
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Select Department</label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {departments.map((dept) => (
                                      <SelectItem key={dept.id} value={dept.id.toString()}>
                                        {dept.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleAdminReview(letter.id, 'forward', parseInt(selectedDepartment))}
                                  disabled={!selectedDepartment || processingId === letter.id}
                                >
                                  Forward
                                </Button>
                                <Button variant="outline" onClick={() => setCurrentLetter(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          onClick={() => handleAdminReview(letter.id, 'needs_minister')}
                          disabled={processingId === letter.id}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Send to Minister
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Minister Decided Section */}
          {ministerDecided.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Letters from Minister ({ministerDecided.length})
                </CardTitle>
                <CardDescription>
                  Forward approved letters to their target departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ministerDecided.map((letter) => (
                    <div key={letter.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{letter.subject}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            From: {getDepartmentName(letter.from_department_id)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Minister Decision: {new Date(letter.minister_decided_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(letter.status)}
                      </div>

                      {letter.status === 'minister_approved' && (
                        <>
                          <Separator className="my-4" />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                onClick={() => {
                                  setCurrentLetter(letter);
                                  setActionType('forward');
                                }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Forward to Department
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Forward Approved Letter</DialogTitle>
                                <DialogDescription>
                                  Select the department to forward this approved letter to
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Select Department</label>
                                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                          {dept.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => handleForward(letter.id, parseInt(selectedDepartment))}
                                    disabled={!selectedDepartment || processingId === letter.id}
                                  >
                                    Forward
                                  </Button>
                                  <Button variant="outline" onClick={() => setCurrentLetter(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Letters Section */}
          <Card>
            <CardHeader>
              <CardTitle>All Letters Overview</CardTitle>
              <CardDescription>
                Complete list of all letters in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {letters.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No letters in the system</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {letters.map((letter) => (
                    <div key={letter.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <h4 className="font-medium">{letter.subject}</h4>
                        <p className="text-sm text-gray-600">
                          {getDepartmentName(letter.from_department_id)} → {letter.to_department_id ? getDepartmentName(letter.to_department_id) : 'Pending'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(letter.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(letter.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
                 </div>
       </main>

       {/* User Management Section */}
       {showUserManagement && (
         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
             <Dialog>
               <DialogTrigger asChild>
                 <Button>
                   <UserPlus className="h-4 w-4 mr-2" />
                   Add New User
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-md">
                 <DialogHeader>
                   <DialogTitle>Create New User</DialogTitle>
                   <DialogDescription>
                     Add a new user to the system
                   </DialogDescription>
                 </DialogHeader>
                 <div className="space-y-4">
                   <div>
                     <Label htmlFor="newUserName">Full Name</Label>
                     <Input
                       id="newUserName"
                       value={newUser.name}
                       onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                       placeholder="Enter full name"
                     />
                   </div>
                   <div>
                     <Label htmlFor="newUserEmail">Email</Label>
                     <Input
                       id="newUserEmail"
                       type="email"
                       value={newUser.email}
                       onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                       placeholder="Enter email address"
                     />
                   </div>
                   <div>
                     <Label htmlFor="newUserPassword">Password</Label>
                     <Input
                       id="newUserPassword"
                       type="password"
                       value={newUser.password}
                       onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                       placeholder="Enter password"
                     />
                   </div>
                   <div>
                     <Label htmlFor="newUserRole">Role</Label>
                     <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select role" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="minister">Minister</SelectItem>
                         <SelectItem value="record_office">Record Office</SelectItem>
                         <SelectItem value="department">Department User</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   {newUser.role === 'department' && (
                     <div>
                       <Label htmlFor="newUserDepartment">Department</Label>
                       <Select value={newUser.department_id} onValueChange={setNewUser.department_id}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select department" />
                         </SelectTrigger>
                         <SelectContent>
                           {departments.map((dept) => (
                             <SelectItem key={dept.id} value={dept.id.toString()}>
                               {dept.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                   )}
                   <div className="flex space-x-2">
                     <Button onClick={handleCreateUser} className="flex-1">
                       Create User
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={() => setNewUser({
                         name: '',
                         email: '',
                         password: '',
                         role: 'department',
                         department_id: ''
                       })}
                     >
                       Clear
                     </Button>
                   </div>
                 </div>
               </DialogContent>
             </Dialog>
           </div>

           <Card>
             <CardHeader>
               <CardTitle>System Users ({users.length})</CardTitle>
               <CardDescription>
                 Manage all users in the system
               </CardDescription>
             </CardHeader>
             <CardContent>
               {users.length === 0 ? (
                 <div className="text-center py-8">
                   <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <p className="text-gray-500">No users found</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {users.map((user) => (
                     <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                       <div className="flex-1">
                         <h4 className="font-medium">{user.name}</h4>
                         <p className="text-sm text-gray-600">{user.email}</p>
                         <div className="flex items-center space-x-2 mt-1">
                           <Badge variant="outline" className="capitalize">
                             {user.role.replace('_', ' ')}
                           </Badge>
                           {user.department_id && (
                             <Badge variant="secondary">
                               {departments.find(d => d.id === user.department_id)?.name || `Dept ${user.department_id}`}
                             </Badge>
                           )}
                         </div>
                       </div>
                       <div className="flex items-center space-x-2">
                         <Dialog>
                           <DialogTrigger asChild>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setEditingUser(user)}
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                           </DialogTrigger>
                           <DialogContent>
                             <DialogHeader>
                               <DialogTitle>Edit User</DialogTitle>
                               <DialogDescription>
                                 Update user information
                               </DialogDescription>
                             </DialogHeader>
                             <div className="space-y-4">
                               <div>
                                 <Label htmlFor="editUserName">Full Name</Label>
                                 <Input
                                   id="editUserName"
                                   value={editingUser?.name || ''}
                                   onChange={(e) => setEditingUser(editingUser ? { ...editingUser, name: e.target.value } : null)}
                                 />
                               </div>
                               <div>
                                 <Label htmlFor="editUserEmail">Email</Label>
                                 <Input
                                   id="editUserEmail"
                                   type="email"
                                   value={editingUser?.email || ''}
                                   onChange={(e) => setEditingUser(editingUser ? { ...editingUser, email: e.target.value } : null)}
                                 />
                               </div>
                               <div>
                                 <Label htmlFor="editUserRole">Role</Label>
                                 <Select 
                                   value={editingUser?.role || 'department'} 
                                   onValueChange={(value: any) => setEditingUser(editingUser ? { ...editingUser, role: value } : null)}
                                 >
                                   <SelectTrigger>
                                     <SelectValue placeholder="Select role" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="minister">Minister</SelectItem>
                                     <SelectItem value="record_office">Record Office</SelectItem>
                                     <SelectItem value="department">Department User</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                               {editingUser?.role === 'department' && (
                                 <div>
                                   <Label htmlFor="editUserDepartment">Department</Label>
                                   <Select 
                                     value={editingUser?.department_id?.toString() || ''} 
                                     onValueChange={(value) => setEditingUser(editingUser ? { ...editingUser, department_id: parseInt(value) } : null)}
                                   >
                                     <SelectTrigger>
                                       <SelectValue placeholder="Select department" />
                                     </SelectTrigger>
                                     <SelectContent>
                                       {departments.map((dept) => (
                                         <SelectItem key={dept.id} value={dept.id.toString()}>
                                           {dept.name}
                                         </SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                 </div>
                               )}
                               <div className="flex space-x-2">
                                 <Button onClick={() => editingUser && handleUpdateUser(editingUser.id)}>Update User</Button>
                                 <Button 
                                   variant="outline" 
                                   onClick={() => setEditingUser(null)}
                                 >
                                   Cancel
                                 </Button>
                               </div>
                             </div>
                           </DialogContent>
                         </Dialog>

                         <Dialog>
                           <DialogTrigger asChild>
                             <Button
                               variant="destructive"
                               size="sm"
                               onClick={() => setDeletingUser(user)}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </DialogTrigger>
                           <DialogContent>
                             <DialogHeader>
                               <DialogTitle>Are you sure?</DialogTitle>
                               <DialogDescription>
                                 This action cannot be undone. This will permanently delete the user account for "{deletingUser?.name}".
                               </DialogDescription>
                             </DialogHeader>
                             <div className="flex justify-end space-x-2">
                               <Button variant="outline" onClick={() => setDeletingUser(null)}>Cancel</Button>
                               <Button variant="destructive" onClick={() => deletingUser && handleDeleteUser(deletingUser.id)}>Delete</Button>
                             </div>
                           </DialogContent>
                         </Dialog>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
         </main>
       )}
     </div>
   );
 };

export { AdminDashboard };