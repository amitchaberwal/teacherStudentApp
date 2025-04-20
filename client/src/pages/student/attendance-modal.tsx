import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class;
  studentId?: number;
}

interface AttendanceRecord {
  id: number;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  comment: string | null;
}

const AttendanceModal = ({ isOpen, onClose, classData, studentId }: AttendanceModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("view-attendance");

  // Fetch attendance records for this student in this class
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['/api/students', studentId, 'attendance', classData?.id],
    queryFn: () => 
      fetch(`/api/students/${studentId}/attendance/${classData?.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load attendance records");
        return res.json();
      }),
    enabled: isOpen && !!studentId && !!classData,
  });

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
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
        
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="view-attendance">Attendance Records</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="view-attendance">
                {isLoading ? (
                  <div className="text-center py-8">Loading attendance records...</div>
                ) : !attendanceRecords?.records || attendanceRecords.records.length === 0 ? (
                  <div className="text-center py-8">
                    No attendance records found for this class.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-4 mb-2 font-medium">
                      <div>Date</div>
                      <div>Status</div>
                      <div className="col-span-2">Comment</div>
                    </div>
                    
                    {attendanceRecords.records.map((record: AttendanceRecord) => (
                      <div key={record.id} className="grid grid-cols-4 gap-4 py-2 border-b">
                        <div>{format(new Date(record.date), "MMMM d, yyyy")}</div>
                        <div className="flex items-center">
                          {getStatusIcon(record.status)}
                          <span className={`ml-1 ${getStatusColor(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </div>
                        <div className="col-span-2 text-gray-600 text-sm">
                          {record.comment || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="summary">
                {isLoading ? (
                  <div className="text-center py-8">Loading attendance summary...</div>
                ) : !attendanceRecords?.summary ? (
                  <div className="text-center py-8">
                    No attendance records found for this class.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {attendanceRecords.summary.present}
                        </div>
                        <div className="text-sm text-green-700">Present</div>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {attendanceRecords.summary.absent}
                        </div>
                        <div className="text-sm text-red-700">Absent</div>
                      </div>
                      
                      <div className="bg-amber-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-amber-600">
                          {attendanceRecords.summary.late}
                        </div>
                        <div className="text-sm text-amber-700">Late</div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {attendanceRecords.summary.excused}
                        </div>
                        <div className="text-sm text-blue-700">Excused</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-3">Attendance Rate</h3>
                      <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-primary"
                          style={{ width: `${attendanceRecords.summary.rate}%` }}
                        >
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                          {attendanceRecords.summary.rate}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="flex flex-col items-center">
            <Label className="mb-2">Calendar View</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              className="border rounded-md"
            />
          </div>
        </div>
        
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

export default AttendanceModal;