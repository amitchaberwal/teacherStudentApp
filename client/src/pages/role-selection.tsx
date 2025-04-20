import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { GraduationCap, User, KeyRound, ChevronLeft, UserPlus } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserRole = "teacher" | "student";

// Schema for login form
const loginFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema for signup form
const signupFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type SignupFormValues = z.infer<typeof signupFormSchema>;

const RoleSelection = () => {
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isRegistering, setIsRegistering] = useState(false);

  // Form for login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Form for signup
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
    },
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsAuthModalOpen(true);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setIsAuthModalOpen(false);
    loginForm.reset();
    signupForm.reset();
  };

  const onLoginSubmit = async (data: LoginFormValues) => {
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
        description: "Welcome back!",
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

  const onSignupSubmit = async (data: SignupFormValues) => {
    if (!selectedRole) return;
    
    setIsRegistering(true);
    try {
      await register({
        ...data,
        role: selectedRole,
      });
      
      // Show success toast
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.name}! You can now log in.`,
      });
      
      // Auto-fill login form with registered credentials
      loginForm.setValue("username", data.username);
      loginForm.setValue("password", data.password);
      setActiveTab("login");
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Username may already be taken. Please try another.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
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
        
        {/* Auth Modal */}
        <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedRole === "teacher" ? "Teacher" : "Student"} Portal</DialogTitle>
              <DialogDescription>
                Sign in to your account or create a new one.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
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
                      control={loginForm.control}
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
              </TabsContent>
              
              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
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
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a unique login ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Choose a secure password" {...field} />
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
                      <Button 
                        type="submit" 
                        className="flex items-center"
                        disabled={isRegistering}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {isRegistering ? "Creating Account..." : "Sign Up"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoleSelection;
