import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
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
import { CalendarIcon, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
}

interface Student {
  id: number;
  name: string;
  username: string;
}

interface AttendanceRecord {
  studentId: number;
  status: "present" | "absent" | "late" | "excused";
  comment: string | null;
}

const AttendanceModal = ({ isOpen, onClose, classData }: AttendanceModalProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<Map<number, AttendanceRecord>>(new Map());
  const [activeTab, setActiveTab] = useState("take-attendance");

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

  // Fetch existing attendance records for this date
  const { data: existingAttendance, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['/api/classes', classData?.id, 'attendance', selectedDate.toISOString()],
    queryFn: () => 
      fetch(`/api/classes/${classData?.id}/attendance?date=${selectedDate.toISOString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load attendance records");
        return res.json();
      }),
    enabled: isOpen && !!classData,
  });

  // Initialize attendance records on data load or date change
  useEffect(() => {
    if (!students) return;

    const newRecords = new Map<number, AttendanceRecord>();
    
    // First set default values
    students.forEach((student: Student) => {
      newRecords.set(student.id, {
        studentId: student.id,
        status: "present",
        comment: null
      });
    });
    
    // Then override with existing values if available
    if (existingAttendance && existingAttendance.length > 0) {
      existingAttendance.forEach((record: any) => {
        if (newRecords.has(record.studentId)) {
          newRecords.set(record.studentId, {
            studentId: record.studentId,
            status: record.status,
            comment: record.comment
          });
        }
      });
    }
    
    setAttendanceRecords(newRecords);
  }, [students, existingAttendance]);

  // Update attendance status for a student
  const handleStatusChange = (studentId: number, status: "present" | "absent" | "late" | "excused") => {
    const updatedRecords = new Map(attendanceRecords);
    const existingRecord = updatedRecords.get(studentId);
    
    if (existingRecord) {
      updatedRecords.set(studentId, { ...existingRecord, status });
      setAttendanceRecords(updatedRecords);
    }
  };

  // Update comment for a student
  const handleCommentChange = (studentId: number, comment: string) => {
    const updatedRecords = new Map(attendanceRecords);
    const existingRecord = updatedRecords.get(studentId);
    
    if (existingRecord) {
      updatedRecords.set(studentId, { ...existingRecord, comment });
      setAttendanceRecords(updatedRecords);
    }
  };

  // Save attendance records
  const saveAttendanceMutation = useMutation({
    mutationFn: (records: any[]) => {
      return apiRequest("POST", "/api/attendance/bulk", { records });
    },
    onSuccess: () => {
      toast({
        title: "Attendance saved",
        description: `Attendance records for ${format(selectedDate, "MMMM d, yyyy")} have been saved.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes', classData?.id, 'attendance'] });
      refetchAttendance();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save attendance",
        variant: "destructive",
      });
    },
  });

  const handleSaveAttendance = () => {
    const records = Array.from(attendanceRecords.values()).map(record => ({
      ...record,
      classId: classData.id,
      date: selectedDate
    }));
    
    saveAttendanceMutation.mutate(records);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Get status icons and colors
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "absent":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "late":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "excused":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "text-green-500";
      case "absent":
        return "text-red-500";
      case "late":
        return "text-amber-500";
      case "excused":
        return "text-blue-500";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance for {classData?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-between items-center mb-4">
          <div className="grid gap-1">
            <Label>Date</Label>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              <span>{format(selectedDate, "MMMM d, yyyy")}</span>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            className="border rounded-md p-3"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="take-attendance">Take Attendance</TabsTrigger>
            <TabsTrigger value="view-summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="take-attendance">
            {isLoadingStudents || isLoadingAttendance ? (
              <div className="text-center py-8">Loading students...</div>
            ) : students && students.length > 0 ? (
              <div className="space-y-4">
                {students.map((student: Student) => {
                  const attendanceRecord = attendanceRecords.get(student.id);
                  
                  return (
                    <div key={student.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-gray-500">{student.username}</p>
                        </div>
                        <Select 
                          value={attendanceRecord?.status || "present"}
                          onValueChange={(value) => handleStatusChange(
                            student.id, 
                            value as "present" | "absent" | "late" | "excused"
                          )}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present" className="text-green-500">Present</SelectItem>
                            <SelectItem value="absent" className="text-red-500">Absent</SelectItem>
                            <SelectItem value="late" className="text-amber-500">Late</SelectItem>
                            <SelectItem value="excused" className="text-blue-500">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Textarea
                        placeholder="Add a comment (optional)"
                        value={attendanceRecord?.comment || ""}
                        onChange={(e) => handleCommentChange(student.id, e.target.value)}
                        className="h-20"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                No students enrolled in this class yet.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="view-summary">
            {isLoadingStudents || isLoadingAttendance ? (
              <div className="text-center py-8">Loading attendance data...</div>
            ) : students && students.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 mb-2 font-medium">
                  <div>Student</div>
                  <div>Status</div>
                  <div className="col-span-2">Comment</div>
                </div>
                
                {students.map((student: Student) => {
                  const record = attendanceRecords.get(student.id);
                  
                  return (
                    <div key={student.id} className="grid grid-cols-4 gap-2 py-2 border-b">
                      <div>{student.name}</div>
                      <div className="flex items-center">
                        {getStatusIcon(record?.status || "present")}
                        <span className={`ml-1 ${getStatusColor(record?.status || "present")}`}>
                          {record?.status.charAt(0).toUpperCase() + record?.status.slice(1)}
                        </span>
                      </div>
                      <div className="col-span-2 text-gray-600 text-sm">
                        {record?.comment || "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                No attendance records to display.
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
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