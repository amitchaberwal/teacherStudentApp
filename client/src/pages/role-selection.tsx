import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { School, User } from "lucide-react";

const RoleSelection = () => {
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleRoleSelect = async (role: "teacher" | "student") => {
    // In a real app, you would show a login form and validate credentials
    // For simplicity, we're using demo credentials here
    try {
      await login({
        username: role === "teacher" ? "teacher1" : "student1",
        password: "password123",
        role
      });
      
      // Redirect to appropriate dashboard
      setLocation(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 fade-in">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-medium text-center mb-8">Welcome to EduConnect</h2>
        <p className="text-gray-600 text-center mb-12">Select your role to continue</p>
        
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          <Card 
            className="p-8 flex-1 max-w-md mx-auto md:mx-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleRoleSelect("teacher")}
          >
            <CardContent className="p-0">
              <div className="flex justify-center mb-6">
                <User className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-2xl font-medium text-center mb-4">I am a Teacher</h3>
              <p className="text-gray-600 text-center">Create classes, track attendance, and manage student grades</p>
            </CardContent>
          </Card>
          
          <Card 
            className="p-8 flex-1 max-w-md mx-auto md:mx-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleRoleSelect("student")}
          >
            <CardContent className="p-0">
              <div className="flex justify-center mb-6">
                <School className="h-16 w-16 text-accent" />
              </div>
              <h3 className="text-2xl font-medium text-center mb-4">I am a Student</h3>
              <p className="text-gray-600 text-center">Join classes, view your attendance records and check your grades</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
