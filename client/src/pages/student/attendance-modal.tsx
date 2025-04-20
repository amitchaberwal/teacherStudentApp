import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: any;
  studentId: number | undefined;
}

const AttendanceModal = ({ isOpen, onClose, classData, studentId }: AttendanceModalProps) => {
  const { toast } = useToast();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: [`/api/students/${studentId}/attendance/${classData.id}`],
    queryFn: () => 
      fetch(`/api/students/${studentId}/attendance/${classData.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load attendance records");
          return res.json();
        }),
    enabled: isOpen && !!studentId && !!classData.id,
  });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Present
          </span>
        );
      case 'absent':
        return (
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
            Absent
          </span>
        );
      case 'late':
        return (
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
            Late
          </span>
        );
      case 'excused':
        return (
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
            Excused
          </span>
        );
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Attendance: {classData.name}
          </DialogTitle>
        </DialogHeader>

        <div className="p-1">
          {/* Attendance Summary */}
          {attendanceData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded text-center">
                <p className="text-sm text-gray-600 mb-1">Present</p>
                <p className="text-xl font-medium text-green-600">{attendanceData.summary.present}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded text-center">
                <p className="text-sm text-gray-600 mb-1">Absent</p>
                <p className="text-xl font-medium text-red-600">{attendanceData.summary.absent}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded text-center">
                <p className="text-sm text-gray-600 mb-1">Late</p>
                <p className="text-xl font-medium text-yellow-600">{attendanceData.summary.late}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded text-center">
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-xl font-medium">{attendanceData.summary.rate}%</p>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-4">Loading attendance records...</div>
          ) : attendanceData?.records?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.records.map((record: any) => (
                    <TableRow key={record.id} className="border-b border-gray-200">
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>{getStatusDisplay(record.status)}</TableCell>
                      <TableCell>{record.comment || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">No attendance records found.</div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceModal;
