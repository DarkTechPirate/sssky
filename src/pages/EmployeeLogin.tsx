import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { apiService } from "@/services/api";

// Import company data from AdminDashboard
const COMPANIES = [
  { id: "company1", name: "Company 1" },
  { id: "company2", name: "Company 2" },
  { id: "company3", name: "Company 3" },
];

const EmployeeLogin = () => {
  const [formData, setFormData] = useState({
    companyId: "",
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form
      if (!formData.companyId || !formData.email || !formData.password) {
        throw new Error("Please fill in all fields to continue.");
      }

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Get employee data
      const employee = await apiService.getEmployeeByEmail(formData.email);
      
      if (!employee) {
        throw new Error("Employee account not found.");
      }

      // Verify company ID only if provided
      if (formData.companyId && employee.companyId !== formData.companyId) {
        throw new Error("Invalid company selection for this employee.");
      }

      // Get user claims to verify role
      const idTokenResult = await userCredential.user.getIdTokenResult();
      if (idTokenResult.claims.role !== 'employee') {
        throw new Error("This account is not authorized as an employee.");
      }

      // Store employee data in localStorage
      localStorage.setItem('employeeData', JSON.stringify({
        uid: employee.uid,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
        companyId: employee.companyId,
        role: employee.role
      }));

      toast({
        title: "Login Successful!",
        description: `Welcome ${employee.name}! Redirecting to your dashboard...`
      });
      
      setTimeout(() => {
        navigate('/employee-dashboard');
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-500 p-3 rounded-full">
                <Users className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">Employee Login</CardTitle>
            <CardDescription className="text-blue-100">
              Enter your credentials to access your tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Select 
                  onValueChange={(value) => setFormData({...formData, companyId: value})}
                  value={formData.companyId}
                >
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Select your company" />
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
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeLogin;
