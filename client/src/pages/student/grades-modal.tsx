import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
  studentId?: number;
}

interface GradeRecord {
  id: number;
  assessment: string;
  date: Date;
  grade: number;
  comment: string;
}

const GradesModal = ({ isOpen, onClose, classData, studentId }: GradesModalProps) => {
  const [activeTab, setActiveTab] = useState("view-grades");

  // Fetch grades for this student in this class
  const { data: gradesData, isLoading } = useQuery({
    queryKey: ['/api/students', studentId, 'grades', classData?.id],
    queryFn: () => 
      fetch(`/api/students/${studentId}/grades/${classData?.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load grades");
        return res.json();
      }),
    enabled: isOpen && !!studentId && !!classData,
  });

  // Get grade color based on score
  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-500";
    if (grade >= 80) return "text-blue-500";
    if (grade >= 70) return "text-yellow-500";
    if (grade >= 60) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grades for {classData?.name}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="view-grades">Grade Records</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view-grades">
            {isLoading ? (
              <div className="text-center py-8">Loading grade records...</div>
            ) : !gradesData?.records || gradesData.records.length === 0 ? (
              <div className="text-center py-8">
                No grade records found for this class.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradesData.records.map((record: GradeRecord) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.assessment}</TableCell>
                        <TableCell>{format(new Date(record.date), "MMM d, yyyy")}</TableCell>
                        <TableCell className={getGradeColor(record.grade)}>
                          {record.grade}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {record.comment || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="summary">
            {isLoading ? (
              <div className="text-center py-8">Loading grade summary...</div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="bg-gray-50 rounded-lg p-8 text-center w-48">
                    <h3 className="text-lg text-gray-600 mb-2">Current Grade</h3>
                    <div className={`text-5xl font-bold ${getGradeColor(Number(gradesData?.current) || 0)}`}>
                      {gradesData?.current}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Grade Distribution</h3>
                  {!gradesData?.records || gradesData.records.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No grade records available to show distribution.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* This would normally be a chart, like a bar chart */}
                      <div className="text-center py-4 text-gray-500">
                        Grade distribution visualization would go here.
                      </div>
                    </div>
                  )}
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