import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { useLocation } from "wouter";
import { Copy, MoreVertical, Plus, Search, Users, Edit, Trash, AlertCircle, Calendar, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CreateClass from "./create-class";
import AttendanceModal from "./attendance-modal";
import GradesModal from "./grades-modal";
import EditClassModal from "./edit-class-modal";
import { Class } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("classes");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [classToEdit, setClassToEdit] = useState<Class | null>(null);

  const { data: classes, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/classes', user?.id],
    queryFn: () => 
      fetch(`/api/classes?teacherId=${user?.id}`).then((res) => {
        if (!res.ok) throw new Error("Failed to load classes");
        return res.json();
      }),
    enabled: !!user?.id,
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: (classId: number) => {
      return apiRequest("DELETE", `/api/classes/${classId}`);
    },
    onSuccess: () => {
      toast({
        title: "Class deleted",
        description: "The class has been successfully deleted",
      });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/classes', user?.id] });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete class",
        variant: "destructive",
      });
    },
  });

  const handleCopyClassCode = (classCode: string) => {
    navigator.clipboard.writeText(classCode);
    toast({
      title: "Class code copied",
      description: "The class code has been copied to your clipboard",
    });
  };

  const handleAttendanceClick = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsAttendanceModalOpen(true);
  };

  const handleGradesClick = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsGradesModalOpen(true);
  };

  const handleManageClick = (classItem: Class) => {
    setSelectedClass(classItem);
    // For now just show a toast, but this could open a modal for managing the class
    toast({
      title: "Manage Class",
      description: `You're now managing ${classItem.name}`,
    });
  };

  const handleEditClass = (classItem: Class) => {
    setClassToEdit(classItem);
    setIsEditModalOpen(true);
    toast({
      title: "Edit Class",
      description: `You can now edit ${classItem.name}`,
    });
  };

  const handleDeleteClass = (classItem: Class) => {
    setClassToDelete(classItem);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteClass = () => {
    if (classToDelete) {
      deleteClassMutation.mutate(classToDelete.id);
      setIsDeleteAlertOpen(false);
      setClassToDelete(null);
    }
  };

  const filteredClasses = classes?.filter((classItem: Class) => 
    classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-2">Teacher Dashboard</h2>
          <p className="text-gray-600">Manage your classes, attendance and grades</p>
        </div>

        <Tabs defaultValue="classes" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start">
            <TabsTrigger value="classes">My Classes</TabsTrigger>
            <TabsTrigger value="create-class">Create Class</TabsTrigger>
          </TabsList>

          <TabsContent value="classes">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium">My Classes</h3>
              <div className="flex items-center">
                <div className="relative mr-4">
                  <Input
                    placeholder="Search classes..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                <Button onClick={() => setActiveTab("create-class")}>
                  <Plus className="h-4 w-4 mr-1" />
                  <span>New Class</span>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-10">Loading classes...</div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">
                Error loading classes. Please try again.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses?.map((classItem: Class) => (
                  <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium">{classItem.name}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <MoreVertical className="h-5 w-5 text-gray-400 cursor-pointer hover:text-primary" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClass(classItem)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClass(classItem)}>
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-gray-600 mb-4">{classItem.description}</p>
                      <div className="flex items-center mb-4">
                        <Users className="h-5 w-5 text-gray-400 mr-2" />
                        <span>{/* Add student count here */}</span>
                        <span className="text-gray-600 ml-1">students</span>
                      </div>
                      <div className="bg-gray-100 p-3 rounded mb-4">
                        <p className="text-sm text-gray-600 mb-1">Class Code:</p>
                        <div className="flex justify-between items-center">
                          <code className="text-primary font-medium">{classItem.classCode}</code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary/80"
                            onClick={() => handleCopyClassCode(classItem.classCode)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button 
                          variant="ghost" 
                          className="text-primary"
                          onClick={() => handleManageClick(classItem)}
                        >
                          Manage
                        </Button>
                        <div>
                          <Button 
                            variant="outline"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 mr-2"
                            onClick={() => handleAttendanceClick(classItem)}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Attendance
                          </Button>
                          <Button 
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-600"
                            onClick={() => handleGradesClick(classItem)}
                          >
                            <GraduationCap className="h-4 w-4 mr-1" />
                            Grades
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Class Card */}
                <Card className="border-dashed border-2 border-gray-300 hover:shadow-lg transition-shadow">
                  <CardContent className="flex flex-col items-center justify-center min-h-[16rem] p-6">
                    <Plus className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-center text-gray-600 mb-4">Create a new class</p>
                    <Button onClick={() => setActiveTab("create-class")}>
                      Create Class
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create-class">
            <CreateClass onSuccess={() => setActiveTab("classes")} />
          </TabsContent>
        </Tabs>
      </div>

      {selectedClass && (
        <>
          <AttendanceModal 
            isOpen={isAttendanceModalOpen} 
            onClose={() => setIsAttendanceModalOpen(false)} 
            classData={selectedClass} 
          />

          <GradesModal 
            isOpen={isGradesModalOpen} 
            onClose={() => setIsGradesModalOpen(false)} 
            classData={selectedClass} 
          />
        </>
      )}

      {/* Delete class confirmation dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
              Delete Class
            </AlertDialogTitle>
            <AlertDialogDescription>
              {classToDelete && (
                <>
                  Are you sure you want to delete <strong>{classToDelete.name}</strong>? This action cannot be undone
                  and all associated data including enrollments, attendance records, and grades will be permanently deleted.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setClassToDelete(null);
                setIsDeleteAlertOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClass}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClassMutation.isPending ? "Deleting..." : "Delete Class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Class Modal */}
      {classToEdit && (
        <EditClassModal 
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setClassToEdit(null);
          }}
          classData={classToEdit}
        />
      )}
    </>
  );
};

export default TeacherDashboard;