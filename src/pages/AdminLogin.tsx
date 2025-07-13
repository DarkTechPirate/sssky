import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

// Fixed admin credentials
const ADMIN_USERNAME = "admin01";
const ADMIN_PASSWORD = "ADMIN123";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: "",
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
      if (!formData.username || !formData.password) {
        throw new Error("Please fill in all fields to continue.");
      }

      // Check fixed credentials
      if (formData.username !== ADMIN_USERNAME || formData.password !== ADMIN_PASSWORD) {
        throw new Error("Invalid admin credentials.");
      }

      // Sign in with Firebase using email (username + domain)
      const adminEmail = `${ADMIN_USERNAME}@checklist-central.com`;
      const userCredential = await signInWithEmailAndPassword(
        auth,
        adminEmail,
        ADMIN_PASSWORD
      );

      // Force token refresh to get latest claims
      await userCredential.user.getIdToken(true);
      
      // Get user claims to verify admin role
      const idTokenResult = await userCredential.user.getIdTokenResult();
      if (idTokenResult.claims.role !== 'admin') {
        await auth.signOut();
        throw new Error("This account is not authorized as an admin.");
      }

      // Store admin data in localStorage
      localStorage.setItem('adminData', JSON.stringify({
        uid: userCredential.user.uid,
        username: ADMIN_USERNAME,
        role: 'admin'
      }));

      toast({
        title: "Admin Login Successful!",
        description: "Welcome! Accessing admin dashboard..."
      });
      
      // Navigate after a short delay to ensure claims are propagated
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      // Clear any existing auth state on error
      await auth.signOut();
      localStorage.removeItem('adminData');
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid admin credentials."
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-purple-600 text-white rounded-t-lg text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-500 p-3 rounded-full">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription className="text-purple-100">
              Access the administrative dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Admin Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="transition-all focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Admin Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
