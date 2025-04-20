import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { classCodeSchema } from "@shared/schema";
import { useAuth } from "../../hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type JoinClassFormValues = {
  classCode: string;
};

interface JoinClassProps {
  onSuccess?: () => void;
}

const JoinClass = ({ onSuccess }: JoinClassProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<JoinClassFormValues>({
    resolver: zodResolver(classCodeSchema),
    defaultValues: {
      classCode: "",
    },
  });

  const joinClassMutation = useMutation({
    mutationFn: (data: JoinClassFormValues) => {
      return apiRequest("POST", "/api/enrollments", {
        classCode: data.classCode,
        studentId: user?.id,
      });
    },
    onSuccess: async () => {
      toast({
        title: "Class joined",
        description: "You have successfully joined the class",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments', user?.id] });
      
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation("/student/dashboard");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join class",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JoinClassFormValues) => {
    joinClassMutation.mutate(data);
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setLocation("/student/dashboard");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h3 className="text-xl font-medium mb-6">Join a Class</h3>
      
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="bg-white rounded-lg shadow p-6"
        >
          <FormField
            control={form.control}
            name="classCode"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="text-gray-600">Class Code *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter class code (e.g. MATH101-XYZ)"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter the class code provided by your teacher
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-between mt-8">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={joinClassMutation.isPending}
            >
              {joinClassMutation.isPending ? "Joining..." : "Join Class"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default JoinClass;
