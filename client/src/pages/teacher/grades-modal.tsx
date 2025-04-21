import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Class } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";

interface GradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
}

interface Student {
  id: number;
  name: string;
  username: string;
}

interface Assessment {
  id: number;
  name: string;
  description: string | null;
  type: "quiz" | "test" | "assignment" | "project" | "exam" | "other";
  maxScore: number;
  classId: number;
  createdAt: Date;
}

interface Grade {
  id?: number;
  studentId: number;
  assessmentId: number;
  score: number;
  comment: string | null;
}

const GradesModal = ({ isOpen, onClose, classData }: GradesModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("enter-grades");
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [isNewAssessmentMode, setIsNewAssessmentMode] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    name: "",
    description: "",
    type: "quiz",
    maxScore: 100,
    classId: classData?.id
  });
  const [grades, setGrades] = useState<Map<number, Grade>>(new Map());

  // Fetch students in this class
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/classes', classData?.id, 'students'],
    queryFn: () => 
      fetch(`/api/classes/${classData?.id}/students`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load students");
        return res.json();
      }),
    enabled: isOpen && !!classData,
  });

  // Fetch assessments for this class
  const { data: assessments, isLoading: isLoadingAssessments, refetch: refetchAssessments } = useQuery({
    queryKey: ['/api/classes', classData?.id, 'assessments'],
    queryFn: () => 
      fetch(`/api/classes/${classData?.id}/assessments`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load assessments");
        return res.json();
      }),
    enabled: isOpen && !!classData,
  });

  // Fetch grades for selected assessment
  const { data: existingGrades, isLoading: isLoadingGrades, refetch: refetchGrades } = useQuery({
    queryKey: ['/api/assessments', selectedAssessment, 'grades'],
    queryFn: () => 
      fetch(`/api/assessments/${selectedAssessment}/grades`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load grades");
        return res.json();
      }),
    enabled: isOpen && !!selectedAssessment,
  });

  // Set default selected assessment when assessments load
  useEffect(() => {
    if (assessments && assessments.length > 0 && !selectedAssessment) {
      setSelectedAssessment(assessments[0].id);
    }
  }, [assessments, selectedAssessment]);

  // Initialize grades map when students or existing grades change
  useEffect(() => {
    if (!students || !selectedAssessment) return;

    const newGrades = new Map<number, Grade>();

    // Set default empty grades for all students
    students.forEach((student: Student) => {
      newGrades.set(student.id, {
        studentId: student.id,
        assessmentId: selectedAssessment,
        score: 0,
        comment: null
      });
    });

    // Override with existing grades if available
    if (existingGrades && existingGrades.length > 0) {
      existingGrades.forEach((grade: Grade) => {
        if (newGrades.has(grade.studentId)) {
          newGrades.set(grade.studentId, grade);
        }
      });
    }

    setGrades(newGrades);
  }, [students, existingGrades, selectedAssessment]);

  // Update grade score for a student
  const handleScoreChange = (studentId: number, score: string) => {
    const parsedScore = parseFloat(score);
    if (isNaN(parsedScore)) return;

    const updatedGrades = new Map(grades);
    const existingGrade = updatedGrades.get(studentId);

    if (existingGrade) {
      updatedGrades.set(studentId, { ...existingGrade, score: parsedScore });
      setGrades(updatedGrades);
    }
  };

  // Update comment for a student's grade
  const handleCommentChange = (studentId: number, comment: string) => {
    const updatedGrades = new Map(grades);
    const existingGrade = updatedGrades.get(studentId);

    if (existingGrade) {
      updatedGrades.set(studentId, { ...existingGrade, comment });
      setGrades(updatedGrades);
    }
  };

  // Create new assessment
  const createAssessmentMutation = useMutation({
    mutationFn: (assessment: any) => {
      return apiRequest("POST", "/api/assessments", assessment);
    },
    onSuccess: (data) => {
      toast({
        title: "Assessment created",
        description: `${newAssessment.name} has been created successfully.`,
      });
      refetchAssessments();
      setIsNewAssessmentMode(false);
      setSelectedAssessment(data.id);
      setNewAssessment({
        name: "",
        description: "",
        type: "quiz",
        maxScore: 100,
        classId: classData?.id
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assessment",
        variant: "destructive",
      });
    },
  });

  // Save grades for selected assessment
  const saveGradesMutation = useMutation({
    mutationFn: (grades: any[]) => {
      return apiRequest("POST", "/api/grades/bulk", { records: grades });
    },
    onSuccess: () => {
      toast({
        title: "Grades saved",
        description: "Grades have been saved successfully.",
      });
      refetchGrades();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save grades",
        variant: "destructive",
      });
    },
  });

  const handleCreateAssessment = () => {
    if (!newAssessment.name) {
      toast({
        title: "Error",
        description: "Assessment name is required",
        variant: "destructive",
      });
      return;
    }

    createAssessmentMutation.mutate(newAssessment);
  };

  const handleSaveGrades = () => {
    if (!selectedAssessment) return;

    const gradesArray = Array.from(grades.values());
    saveGradesMutation.mutate(gradesArray);
  };

  const getCurrentAssessment = () => {
    if (!assessments || !selectedAssessment) return null;
    return assessments.find((a: Assessment) => a.id === selectedAssessment);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grades for {(classData?.name || '').charAt(0).toUpperCase() + (classData?.name || '').slice(1)}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="enter-grades">Enter Grades</TabsTrigger>
            <TabsTrigger value="view-summary">Grade Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="enter-grades">
            {isNewAssessmentMode ? (
              <div className="space-y-4 mb-6 p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Create New Assessment</h3>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="assessment-name">Assessment Name *</Label>
                    <Input
                      id="assessment-name"
                      value={newAssessment.name}
                      onChange={(e) => setNewAssessment({...newAssessment, name: e.target.value})}
                      placeholder="e.g. Midterm Exam"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="assessment-type">Type</Label>
                    <Select
                      value={newAssessment.type}
                      onValueChange={(value) => setNewAssessment({...newAssessment, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="assessment-max-score">Maximum Score</Label>
                    <Input
                      id="assessment-max-score"
                      type="number"
                      value={newAssessment.maxScore}
                      onChange={(e) => setNewAssessment({...newAssessment, maxScore: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="assessment-description">Description (Optional)</Label>
                    <Textarea
                      id="assessment-description"
                      value={newAssessment.description}
                      onChange={(e) => setNewAssessment({...newAssessment, description: e.target.value})}
                      placeholder="Brief description of this assessment"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNewAssessmentMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAssessment}
                    disabled={createAssessmentMutation.isPending || !newAssessment.name}
                  >
                    {createAssessmentMutation.isPending ? "Creating..." : "Create Assessment"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1 mr-4">
                    <Label htmlFor="select-assessment" className="mb-2 block">Select Assessment</Label>
                    <Select
                      value={selectedAssessment?.toString() || ""}
                      onValueChange={(value) => setSelectedAssessment(parseInt(value))}
                      disabled={isLoadingAssessments || (assessments && assessments.length === 0)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingAssessments ? "Loading..." : "Select assessment"} />
                      </SelectTrigger>
                      <SelectContent>
                        {assessments && assessments.map((assessment: Assessment) => (
                          <SelectItem key={assessment.id} value={assessment.id.toString()}>
                            {assessment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    variant="outline"
                    className="flex items-center mt-7"
                    onClick={() => setIsNewAssessmentMode(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>

                {/* Current assessment details */}
                {getCurrentAssessment() && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
                    <p><strong>Type:</strong> {(getCurrentAssessment()?.type || '').charAt(0).toUpperCase() + (getCurrentAssessment()?.type || '').slice(1)}</p>
                    <p><strong>Max Score:</strong> {getCurrentAssessment()?.maxScore}</p>
                    {getCurrentAssessment()?.description && (
                      <p><strong>Description:</strong> {getCurrentAssessment()?.description}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isNewAssessmentMode && (
              <div>
                {isLoadingStudents || isLoadingGrades ? (
                  <div className="text-center py-8">Loading...</div>
                ) : !assessments || assessments.length === 0 ? (
                  <div className="text-center py-8">
                    No assessments created yet. Create a new assessment to start entering grades.
                  </div>
                ) : !students || students.length === 0 ? (
                  <div className="text-center py-8">
                    No students enrolled in this class yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {students.map((student: Student) => {
                      const grade = grades.get(student.id);

                      return (
                        <div key={student.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{student.name}</h4>
                              <p className="text-sm text-gray-500">{student.username}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`score-${student.id}`} className="mr-2">Score:</Label>
                              <Input
                                id={`score-${student.id}`}
                                type="number"
                                className="w-[100px]"
                                value={grade?.score || 0}
                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                min={0}
                                max={getCurrentAssessment()?.maxScore || 100}
                              />
                              <span className="text-sm text-gray-500">/ {getCurrentAssessment()?.maxScore || 100}</span>
                            </div>
                          </div>

                          <Textarea
                            placeholder="Add feedback (optional)"
                            value={grade?.comment || ""}
                            onChange={(e) => handleCommentChange(student.id, e.target.value)}
                            className="h-20"
                          />
                        </div>
                      );
                    })}

                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={handleSaveGrades}
                        disabled={saveGradesMutation.isPending || !selectedAssessment}
                      >
                        {saveGradesMutation.isPending ? "Saving..." : "Save Grades"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="view-summary">
            {isLoadingStudents || isLoadingAssessments ? (
              <div className="text-center py-8">Loading grade data...</div>
            ) : !assessments || assessments.length === 0 ? (
              <div className="text-center py-8">
                No assessments created yet. Create assessments to view grade summaries.
              </div>
            ) : !students || students.length === 0 ? (
              <div className="text-center py-8">
                No students enrolled in this class yet.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        {assessments.map((assessment: Assessment) => (
                          <th key={assessment.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {assessment.name}
                          </th>
                        ))}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student: Student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.username}</div>
                          </td>
                          {/* This would be populated with actual grade data from the API */}
                          {assessments.map((assessment: Assessment) => (
                            <td key={assessment.id} className="px-6 py-4 whitespace-nowrap">
                              {/* Placeholder for grade display */}
                              <div className="text-sm">-</div>
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            -
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GradesModal;