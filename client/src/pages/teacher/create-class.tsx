import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassSchema } from "@shared/schema";
import { z } from "zod";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extend the schema with validation and add teacherId
const createClassSchema = insertClassSchema
  .extend({
    name: z.string().min(3, "Class name must be at least 3 characters"),
    subject: z.string().min(1, "Subject is required"),
    gradeLevel: z.string().min(1, "Grade/Year level is required"),
  })
  .omit({ teacherId: true, classCode: true }); // We'll add teacherId in the component

type CreateClassFormValues = z.infer<typeof createClassSchema>;

interface CreateClassProps {
  onSuccess?: () => void;
}

const CreateClass = ({ onSuccess }: CreateClassProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      subject: "",
      description: "",
      gradeLevel: "",
    },
  });

  const createClassMutation = useMutation({
    mutationFn: (data: CreateClassFormValues) => {
      const formDataWithTeacher = {
        ...data,
        teacherId: user?.id,
      };
      return apiRequest("POST", "/api/classes", formDataWithTeacher);
    },
    onSuccess: async () => {
      toast({
        title: "Class created",
        description: "Your class has been created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/classes', user?.id] });
      
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation("/teacher/dashboard");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateClassFormValues) => {
    createClassMutation.mutate(data);
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setLocation("/teacher/dashboard");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-xl font-medium mb-6">Create a New Class</h3>
      
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="bg-white rounded-lg shadow p-6"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel className="text-gray-600">Class Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Mathematics 101"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel className="text-gray-600">Subject *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="geography">Geography</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="physical_education">Physical Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel className="text-gray-600">Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of the class"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="gradeLevel"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel className="text-gray-600">Grade/Year Level *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade/year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1st Grade</SelectItem>
                    <SelectItem value="2">2nd Grade</SelectItem>
                    <SelectItem value="3">3rd Grade</SelectItem>
                    <SelectItem value="4">4th Grade</SelectItem>
                    <SelectItem value="5">5th Grade</SelectItem>
                    <SelectItem value="6">6th Grade</SelectItem>
                    <SelectItem value="7">7th Grade</SelectItem>
                    <SelectItem value="8">8th Grade</SelectItem>
                    <SelectItem value="9">9th Grade</SelectItem>
                    <SelectItem value="10">10th Grade</SelectItem>
                    <SelectItem value="11">11th Grade</SelectItem>
                    <SelectItem value="12">12th Grade</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                  </SelectContent>
                </Select>
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
              disabled={createClassMutation.isPending}
            >
              {createClassMutation.isPending ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateClass;
