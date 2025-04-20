import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { classCodeSchema } from "@shared/schema";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

const joinClassSchema = classCodeSchema;
type JoinClassFormValues = z.infer<typeof joinClassSchema>;

interface JoinClassProps {
  onSuccess: () => void;
}

const JoinClass = ({ onSuccess }: JoinClassProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<JoinClassFormValues>({
    resolver: zodResolver(joinClassSchema),
    defaultValues: {
      classCode: "",
    },
  });

  const enrollMutation = useMutation({
    mutationFn: (data: JoinClassFormValues) => {
      return apiRequest("POST", "/api/enrollments", {
        classCode: data.classCode,
        studentId: user?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have successfully joined the class",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join class",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JoinClassFormValues) => {
    enrollMutation.mutate(data);
  };

  return (
    <div className="container max-w-xl mx-auto">
      <h3 className="text-xl font-medium mb-6">Join a Class</h3>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <GraduationCap className="h-5 w-5 text-primary mr-2" />
            <h4 className="text-lg font-medium">Enter Class Code</h4>
          </div>
          
          <p className="text-gray-600 mb-6">
            Enter the class code provided by your teacher to join a class. Class codes are typically
            in the format SUBJ-XXXXXX (e.g., MATH-AB12CD).
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="classCode"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Class Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., MATH-AB12CD" 
                        autoCapitalize="characters"
                        {...field} 
                        value={field.value?.toUpperCase()}
                        onChange={(e) => field.onChange(e.target.value?.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  disabled={enrollMutation.isPending || !form.formState.isValid}
                >
                  {enrollMutation.isPending ? "Joining..." : "Join Class"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="text-blue-700 font-medium mb-2">Tips for Joining Classes</h4>
        <ul className="list-disc list-inside text-blue-600 space-y-1">
          <li>Make sure to enter the code exactly as provided by your teacher</li>
          <li>Class codes are not case-sensitive</li>
          <li>If you're having trouble, ask your teacher to verify the code</li>
          <li>You cannot join a class twice</li>
        </ul>
      </div>
    </div>
  );
};

export default JoinClass;