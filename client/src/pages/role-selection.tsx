import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { GraduationCap, User, KeyRound, ChevronLeft } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserRole = "teacher" | "student";

// Schema for login form
const loginFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const RoleSelection = () => {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Form for login
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
    },
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsLoginOpen(true);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setIsLoginOpen(false);
    form.reset();
  };

  const onSubmit = async (data: LoginFormValues) => {
    if (!selectedRole) return;
    
    try {
      await login({
        username: data.username,
        password: data.password,
        role: selectedRole,
      });
      
      // Show success toast
      toast({
        title: "Login successful",
        description: `Welcome, ${data.name}!`,
      });
      
      // Redirect to appropriate dashboard
      setLocation(selectedRole === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
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
                <GraduationCap className="h-16 w-16 text-accent" />
              </div>
              <h3 className="text-2xl font-medium text-center mb-4">I am a Student</h3>
              <p className="text-gray-600 text-center">Join classes, view your attendance records and check your grades</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Login Modal */}
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Login as {selectedRole === "teacher" ? "Teacher" : "Student"}</DialogTitle>
              <DialogDescription>
                Enter your details to access your account.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your login ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBackToRoles} 
                    className="flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button type="submit" className="flex items-center">
                    <KeyRound className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 pt-2">
                  <div>Demo Teacher Account: username "teacher1", password "password"</div>
                  <div>Demo Student Account: username "student1", password "password"</div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoleSelection;
