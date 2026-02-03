import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, LogOut, CheckSquare, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import checklistData from '../../Checklist-new.json';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface ChecklistItem {
  [key: string]: string;
}

const EmployeeDashboard = () => {
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("ORIG");
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get all sheet names from the JSON file
  const sheetNames = Object.keys(checklistData);

  // Convert JSON data to tasks format
  const convertSheetToTasks = (sheetName: string): Task[] => {
    const sheetData = checklistData[sheetName] as ChecklistItem[];
    return sheetData.map((item, index) => {
      // Get the first key that's not "Column2" as the title
      const titleKey = Object.keys(item).find(key => key !== "Column2") || "";
      return {
        id: `${sheetName}-${index}`,
        title: item[titleKey] || "",
        description: item.Column2 || "",
        completed: false
      };
    }).filter(task => task.title && task.description); // Filter out empty tasks
  };

  useEffect(() => {
    const stored = localStorage.getItem('employeeData');
    if (!stored) {
      navigate('/employee-login');
      return;
    }
    setEmployeeData(JSON.parse(stored));

    // Load existing task progress
    const storedTasks = localStorage.getItem('employeeTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      // Initialize with tasks from the first sheet
      setTasks(convertSheetToTasks(selectedSheet));
    }
  }, [navigate]);

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    // Load tasks for the selected sheet
    const sheetTasks = convertSheetToTasks(sheetName);
    // Preserve completion status for existing tasks
    const existingTasks = JSON.parse(localStorage.getItem('employeeTasks') || '[]');
    const updatedTasks = sheetTasks.map(task => {
      const existing = existingTasks.find((t: Task) => t.id === task.id);
      return existing || task;
    });
    setTasks(updatedTasks);
    localStorage.setItem('employeeTasks', JSON.stringify(updatedTasks));
  };

  const handleTaskToggle = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('employeeTasks', JSON.stringify(updatedTasks));
    
    const task = updatedTasks.find(t => t.id === taskId);
    toast({
      title: task?.completed ? "Task Completed!" : "Task Unmarked",
      description: task?.completed ? "Great job completing this task!" : "Task marked as incomplete"
    });
  };

  const handleSubmitProgress = async () => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    
    try {
      // Submit to backend API
      const submissionData = {
        employeeId: employeeData.employeeId,
        employeeData: {
          name: employeeData.name,
          email: employeeData.email,
          employeeId: employeeData.employeeId,
          companyId: employeeData.companyId
        },
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          completedAt: t.completed ? new Date() : undefined
        }))
      };
      
      await apiService.addSubmission(submissionData);
      
      // Also store locally
      const existingSubmissions = JSON.parse(localStorage.getItem('taskSubmissions') || '[]');
      existingSubmissions.push({
        ...submissionData,
        submittedAt: new Date().toISOString(),
        completionRate: (completedTasks / totalTasks) * 100
      });
      localStorage.setItem('taskSubmissions', JSON.stringify(existingSubmissions));
      
      toast({
        title: "Progress Submitted!",
        description: `${completedTasks} out of ${totalTasks} tasks completed. Great work!`
      });
    } catch (error) {
      console.error('Failed to submit progress:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit progress. Please try again."
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeData');
    localStorage.removeItem('authToken');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
    navigate('/');
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercentage = (completedCount / tasks.length) * 100;

  if (!employeeData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Employee Dashboard</h1>
                <p className="text-sm text-gray-600">{employeeData.companyId}</p>
              </div>
            </div>
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

      <div className="container mx-auto px-4 py-8">
        {/* Employee Info Card */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Employee Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {employeeData.name}</p>
                <p><strong>Employee ID:</strong> {employeeData.employeeId}</p>
                <p><strong>Company:</strong> {employeeData.companyId}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckSquare className="h-5 w-5" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tasks Completed</span>
                    <span>{completedCount}/{tasks.length}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                <p className="text-lg font-semibold text-blue-600">
                  {Math.round(progressPercentage)}% Complete
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Today's Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
                <Button 
                  onClick={handleSubmitProgress}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                >
                  Submit Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sheet Selection Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {sheetNames.map((sheetName) => (
            <Button
              key={sheetName}
              variant={selectedSheet === sheetName ? "default" : "outline"}
              onClick={() => handleSheetChange(sheetName)}
              className="min-w-[120px]"
            >
              {sheetName.replace("|", " | ")}
            </Button>
          ))}
        </div>

        {/* Task Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {selectedSheet.replace("|", " | ")} Tasks
            </CardTitle>
            <CardDescription>
              Complete your assigned tasks and track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                    task.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h4>
                      <p className={`text-sm mt-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    </div>
                    {task.completed && (
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
