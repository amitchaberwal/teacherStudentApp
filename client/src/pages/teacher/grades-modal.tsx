import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Class, InsertAssessment, InsertGrade } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
}

const GradesModal = ({ isOpen, onClose, classData }: GradesModalProps) => {
  const { toast } = useToast();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | "">("");
  const [newAssessmentName, setNewAssessmentName] = useState("");
  const [gradeRecords, setGradeRecords] = useState<Record<number, {
    score: number;
    comment: string;
  }>>({});

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: [`/api/classes/${classData.id}/students`],
    queryFn: () => fetch(`/api/classes/${classData.id}/students`).then((res) => res.json()),
    enabled: isOpen && !!classData.id,
  });

  const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: [`/api/classes/${classData.id}/assessments`],
    queryFn: () => fetch(`/api/classes/${classData.id}/assessments`).then((res) => res.json()),
    enabled: isOpen && !!classData.id,
  });

  const { data: grades, isLoading: isLoadingGrades } = useQuery({
    queryKey: [`/api/assessments/${selectedAssessmentId}/grades`],
    queryFn: () => fetch(`/api/assessments/${selectedAssessmentId}/grades`).then((res) => res.json()),
    enabled: isOpen && !!selectedAssessmentId && selectedAssessmentId !== "",
  });

  useEffect(() => {
    // Initialize or update grade records when grades data is loaded
    if (students && grades && !isLoadingGrades) {
      const newRecords: Record<number, { score: number; comment: string }> = {};
      
      students.forEach((student: any) => {
        // Find existing grade for this student
        const existing = grades.find(
          (g: any) => g.studentId === student.id
        );
        
        newRecords[student.id] = {
          score: existing?.score || 0,
          comment: existing?.comment || "",
        };
      });
      
      setGradeRecords(newRecords);
    }
  }, [students, grades, isLoadingGrades]);

  const createAssessmentMutation = useMutation({
    mutationFn: (data: InsertAssessment) => {
      return apiRequest("POST", "/api/assessments", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Assessment added",
        description: "New assessment has been created",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/classes/${classData.id}/assessments`]
      });
      setNewAssessmentName("");
      
      // Get the ID from the response and select the new assessment
      response.json().then((data) => {
        setSelectedAssessmentId(data.id);
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create assessment",
        variant: "destructive",
      });
    },
  });

  const saveGradesMutation = useMutation({
    mutationFn: (records: InsertGrade[]) => {
      return apiRequest("POST", "/api/grades/bulk", { records });
    },
    onSuccess: () => {
      toast({
        title: "Grades saved",
        description: "Grade records have been updated",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/assessments/${selectedAssessmentId}/grades`]
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save grades",
        variant: "destructive",
      });
    },
  });

  const handleAddAssessment = () => {
    if (!newAssessmentName.trim()) {
      toast({
        title: "Error",
        description: "Assessment name is required",
        variant: "destructive",
      });
      return;
    }
    
    createAssessmentMutation.mutate({
      classId: classData.id,
      name: newAssessmentName.trim()
    });
  };

  const handleSaveGrades = () => {
    if (!students || !selectedAssessmentId) return;
    
    const records = students.map((student: any) => ({
      assessmentId: selectedAssessmentId as number,
      studentId: student.id,
      score: gradeRecords[student.id]?.score || 0,
      comment: gradeRecords[student.id]?.comment || "",
    }));
    
    saveGradesMutation.mutate(records);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Grades: {classData.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-1">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div>
              <label htmlFor="assessmentSelect" className="block text-gray-600 mb-2">Assessment</label>
              <Select 
                value={selectedAssessmentId ? String(selectedAssessmentId) : ""}
                onValueChange={(value) => setSelectedAssessmentId(Number(value))}
              >
                <SelectTrigger id="assessmentSelect" className="w-[180px]">
                  <SelectValue placeholder="Select Assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments?.map((assessment: any) => (
                    <SelectItem key={assessment.id} value={String(assessment.id)}>
                      {assessment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="newAssessment" className="block text-gray-600 mb-2">New Assessment</label>
              <div className="flex">
                <Input
                  id="newAssessment"
                  placeholder="e.g. Quiz 2"
                  value={newAssessmentName}
                  onChange={(e) => setNewAssessmentName(e.target.value)}
                  className="rounded-r-none"
                />
                <Button 
                  onClick={handleAddAssessment}
                  disabled={createAssessmentMutation.isPending}
                  className="rounded-l-none"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {!selectedAssessmentId ? (
            <div className="text-center py-10">Select or create an assessment to enter grades</div>
          ) : isLoadingStudents ? (
            <div className="text-center py-4">Loading students...</div>
          ) : students?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id} className="border-b border-gray-200">
                      <TableCell>{student.name}</TableCell>
                      <TableCell>ST-{student.id}</TableCell>
                      <TableCell className="w-32">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="0-100"
                          value={gradeRecords[student.id]?.score || ""}
                          onChange={(e) => {
                            setGradeRecords({
                              ...gradeRecords,
                              [student.id]: {
                                ...gradeRecords[student.id],
                                score: Number(e.target.value),
                              },
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Optional comment"
                          value={gradeRecords[student.id]?.comment || ""}
                          onChange={(e) => {
                            setGradeRecords({
                              ...gradeRecords,
                              [student.id]: {
                                ...gradeRecords[student.id],
                                comment: e.target.value,
                              },
                            });
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">No students enrolled in this class.</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveGrades}
            disabled={!selectedAssessmentId || saveGradesMutation.isPending}
          >
            {saveGradesMutation.isPending ? "Saving..." : "Save Grades"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GradesModal;
