import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Class, InsertAttendance } from "@shared/schema";
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

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
}

const AttendanceModal = ({ isOpen, onClose, classData }: AttendanceModalProps) => {
  const { toast } = useToast();
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, {
    status: "present" | "absent" | "late" | "excused";
    comment: string;
  }>>({});

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: [`/api/classes/${classData.id}/students`],
    queryFn: () => fetch(`/api/classes/${classData.id}/students`).then((res) => res.json()),
    enabled: isOpen && !!classData.id,
  });

  const { data: existingAttendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: [`/api/classes/${classData.id}/attendance`, attendanceDate],
    queryFn: () => 
      fetch(`/api/classes/${classData.id}/attendance?date=${attendanceDate}`)
        .then((res) => res.json()),
    enabled: isOpen && !!classData.id && !!attendanceDate,
  });

  useEffect(() => {
    // Initialize or update attendance records when attendance data is loaded
    if (students && (!isLoadingAttendance || existingAttendance)) {
      const newRecords: Record<number, { status: "present" | "absent" | "late" | "excused"; comment: string }> = {};
      
      students.forEach((student: any) => {
        // Find existing attendance for this student
        const existing = existingAttendance?.find(
          (a: any) => a.studentId === student.id
        );
        
        newRecords[student.id] = {
          status: existing?.status || "present",
          comment: existing?.comment || "",
        };
      });
      
      setAttendanceRecords(newRecords);
    }
  }, [students, existingAttendance, isLoadingAttendance]);

  const handleQuickSet = (status: "present" | "absent" | "late" | "excused") => {
    if (!students) return;
    
    const newRecords = { ...attendanceRecords };
    students.forEach((student: any) => {
      newRecords[student.id] = {
        ...newRecords[student.id],
        status,
      };
    });
    
    setAttendanceRecords(newRecords);
  };

  const saveAttendanceMutation = useMutation({
    mutationFn: (records: InsertAttendance[]) => {
      return apiRequest("POST", "/api/attendance/bulk", { records });
    },
    onSuccess: () => {
      toast({
        title: "Attendance saved",
        description: "Attendance records have been updated",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/classes/${classData.id}/attendance`]
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance",
        variant: "destructive",
      });
    },
  });

  const handleSaveAttendance = () => {
    if (!students) return;
    
    const records = students.map((student: any) => ({
      classId: classData.id,
      studentId: student.id,
      date: new Date(attendanceDate),
      status: attendanceRecords[student.id]?.status || "present",
      comment: attendanceRecords[student.id]?.comment || "",
    }));
    
    saveAttendanceMutation.mutate(records);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Attendance: {classData.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-1">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div>
              <label htmlFor="attendanceDate" className="block text-gray-600 mb-2">Date</label>
              <Input
                type="date"
                id="attendanceDate"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="attendanceStatus" className="block text-gray-600 mb-2">Quick Set</label>
              <Select onValueChange={(value: "present" | "absent" | "late" | "excused") => handleQuickSet(value)}>
                <SelectTrigger id="attendanceStatus" className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Mark All Present</SelectItem>
                  <SelectItem value="absent">Mark All Absent</SelectItem>
                  <SelectItem value="late">Mark All Late</SelectItem>
                  <SelectItem value="excused">Mark All Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoadingStudents ? (
            <div className="text-center py-4">Loading students...</div>
          ) : students?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id} className="border-b border-gray-200">
                      <TableCell>{student.name}</TableCell>
                      <TableCell>ST-{student.id}</TableCell>
                      <TableCell>
                        <Select
                          value={attendanceRecords[student.id]?.status || "present"}
                          onValueChange={(value: "present" | "absent" | "late" | "excused") => {
                            setAttendanceRecords({
                              ...attendanceRecords,
                              [student.id]: {
                                ...attendanceRecords[student.id],
                                status: value,
                              },
                            });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={attendanceRecords[student.id]?.comment || ""}
                          placeholder="Optional comment"
                          onChange={(e) => {
                            setAttendanceRecords({
                              ...attendanceRecords,
                              [student.id]: {
                                ...attendanceRecords[student.id],
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
            onClick={handleSaveAttendance}
            disabled={saveAttendanceMutation.isPending}
          >
            {saveAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceModal;
