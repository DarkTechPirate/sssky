import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, LogOut, Users, BarChart3, CheckSquare, Calendar, Building, UserPlus, UserX, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

// Define available companies
const COMPANIES = [
  { id: "all", name: "All Companies" },
  { id: "company1", name: "Company 1" },
  { id: "company2", name: "Company 2" },
  { id: "company3", name: "Company 3" },
];

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  companyId: string;
  email: string;
  password: string; // Add password field
}

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showManageEmployees, setShowManageEmployees] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    employeeId: "",
    companyId: "",
    email: "",
    password: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('adminData');
    if (!stored) {
      navigate('/admin-login');
      return;
    }
    setAdminData(JSON.parse(stored));

    // Real-time Firestore listener
    const unsubscribe = apiService.onEmployeesChange((updatedEmployees) => {
      setEmployees(updatedEmployees);
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminData');
    toast({
      title: "Logged Out",
      description: "Admin session ended successfully."
    });
    navigate('/');
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.companyId || !newEmployee.email || !newEmployee.password || !newEmployee.employeeId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all fields including Employee ID."
      });
      return;
    }

    if (newEmployee.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Password must be at least 8 characters long."
      });
      return;
    }

    setIsAddingEmployee(true);

    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newEmployee.email,
        newEmployee.password
      );

      // Set custom claims using Vercel endpoint
      const response = await fetch('/api/setCustomClaims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          role: 'employee'
        }),
      });

      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        // If setting claims fails, delete the created user
        await userCredential.user.delete();
        throw new Error(errorData.error || 'Failed to set user role');
      }

      // Add employee to Firestore
      const employeeData = {
        name: newEmployee.name,
        email: newEmployee.email,
        employeeId: newEmployee.employeeId,
        companyId: newEmployee.companyId,
        uid: userCredential.user.uid,
        role: 'employee'
      };

      const employeeId = await apiService.addEmployee(employeeData);
      
      // Update local state with new employee
      setEmployees(prev => [...prev, { ...employeeData, id: employeeId, createdAt: new Date() }]);
      
      toast({
        title: "Employee Added",
        description: "New employee has been successfully added."
      });

      // Show credentials in a separate toast
      toast({
        title: "Employee Credentials",
        description: `
          Email: ${newEmployee.email}
          Password: ${newEmployee.password}
          Employee ID: ${newEmployee.employeeId}
          Please share these credentials securely with the employee.
        `,
        duration: 10000,
      });

      // Reset form
      setNewEmployee({
        name: "",
        employeeId: "",
        companyId: "",
        email: "",
        password: ""
      });
    } catch (error) {
      console.error('Failed to add employee:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add employee. Please try again."
      });
    } finally {
      setIsAddingEmployee(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await apiService.deleteEmployee(employeeId);
      
      toast({
        title: "Employee Removed",
        description: "Employee has been successfully removed."
      });
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete employee. Please try again."
      });
    }
  };

  // Filter submissions based on selected company
  const filteredSubmissions = selectedCompany === "all" 
    ? submissions 
    : submissions.filter(sub => sub.employeeData.companyId === selectedCompany);

  const getEmployeeStats = () => {
    const totalEmployees = filteredSubmissions.length;
    const totalTasks = filteredSubmissions.reduce((acc, sub) => acc + sub.tasks.length, 0);
    const completedTasks = filteredSubmissions.reduce((acc, sub) => 
      acc + sub.tasks.filter((task: any) => task.completed).length, 0
    );
    const avgCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return { totalEmployees, totalTasks, completedTasks, avgCompletion };
  };

  const stats = getEmployeeStats();

  if (!adminData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">{adminData.adminName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-500" />
                <Select
                  value={selectedCompany}
                  onValueChange={setSelectedCompany}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANIES.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsDialogOpen(true)}>
                    <Users className="h-4 w-4" />
                    Manage Employees
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Manage Employees</DialogTitle>
                    <DialogDescription>
                      Add or remove employees from the system
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Add Employee Form */}
                  <div className="border rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Add New Employee</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Employee Name</Label>
                        <Input
                          id="name"
                          value={newEmployee.name}
                          onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                          placeholder="Enter employee name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">Employee ID</Label>
                        <Input
                          id="employeeId"
                          value={newEmployee.employeeId}
                          onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                          placeholder="Enter employee ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmployee.email}
                          onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Select
                          value={newEmployee.companyId}
                          onValueChange={(value) => setNewEmployee({...newEmployee, companyId: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPANIES.filter(c => c.id !== "all").map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="password">
                          Password
                          <span className="text-sm text-gray-500 ml-2">
                            (Minimum 8 characters)
                          </span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type="password"
                            value={newEmployee.password}
                            onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                            placeholder="Set employee password"
                            className="pr-20"
                            minLength={8}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                            onClick={() => {
                              // Generate a random password
                              const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                              let password = "";
                              for (let i = 0; i < 12; i++) {
                                const randomIndex = Math.floor(Math.random() * charset.length);
                                password += charset[randomIndex];
                              }
                              setNewEmployee({...newEmployee, password});
                            }}
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="mt-4 w-full"
                      onClick={handleAddEmployee}
                      disabled={isAddingEmployee}
                    >
                      {isAddingEmployee ? (
                        <>Loading...</>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Employee
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Employee List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Current Employees</h3>
                    {employees.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No employees added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {employees.map((employee) => (
                          <div
                            key={employee.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <p className="text-sm text-gray-500">
                                  ID: {employee.employeeId} | 
                                  Company: {COMPANIES.find(c => c.id === employee.companyId)?.name} |
                                  Email: {employee.email}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.id)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-blue-600" />
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</p>
              <p className="text-sm text-gray-600">Active submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckSquare className="h-5 w-5 text-green-600" />
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
              <p className="text-sm text-gray-600">Out of {stats.totalTasks} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{Math.round(stats.avgCompletion)}%</p>
              <Progress value={stats.avgCompletion} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
                Last Update
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-orange-600">
                {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Progress Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Employee Task Progress</CardTitle>
            <CardDescription>
              Monitor individual employee task completion status
              {selectedCompany !== "all" && ` for ${COMPANIES.find(c => c.id === selectedCompany)?.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No Employee Submissions Yet
                </h3>
                <p className="text-gray-500">
                  Employee task submissions will appear here once they start completing their checklists.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((submission, index) => {
                  const completedTasks = submission.tasks.filter((task: any) => task.completed).length;
                  const totalTasks = submission.tasks.length;
                  const completionRate = (completedTasks / totalTasks) * 100;

                  return (
                    <div key={index} className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold">{submission.employeeData.username}</h4>
                          <p className="text-sm text-gray-600">
                            ID: {submission.employeeData.employeeId} | 
                            Company: {COMPANIES.find(c => c.id === submission.employeeData.companyId)?.name} |
                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round(completionRate)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {completedTasks}/{totalTasks} tasks
                          </div>
                        </div>
                      </div>
                      
                      <Progress value={completionRate} className="h-3 mb-4" />
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-green-700 mb-2">Completed Tasks:</h5>
                          <ul className="text-sm space-y-1">
                            {submission.tasks
                              .filter((task: any) => task.completed)
                              .map((task: any) => (
                                <li key={task.id} className="flex items-center gap-2">
                                  <CheckSquare className="h-4 w-4 text-green-600" />
                                  {task.title}
                                </li>
                              ))
                            }
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-orange-700 mb-2">Pending Tasks:</h5>
                          <ul className="text-sm space-y-1">
                            {submission.tasks
                              .filter((task: any) => !task.completed)
                              .map((task: any) => (
                                <li key={task.id} className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-orange-400 rounded"></div>
                                  {task.title}
                                </li>
                              ))
                            }
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
