import { useQuery } from "@tanstack/react-query";
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

interface GradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: any;
  studentId: number | undefined;
}

const GradesModal = ({ isOpen, onClose, classData, studentId }: GradesModalProps) => {
  const { data: gradesData, isLoading } = useQuery({
    queryKey: [`/api/students/${studentId}/grades/${classData.id}`],
    queryFn: () => 
      fetch(`/api/students/${studentId}/grades/${classData.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load grade records");
          return res.json();
        }),
    enabled: isOpen && !!studentId && !!classData.id,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Grades: {classData.name}
          </DialogTitle>
        </DialogHeader>

        <div className="p-1">
          {/* Grade Summary */}
          {gradesData?.current && (
            <div className="mb-6">
              <div className="bg-gray-100 p-4 rounded mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium">Current Grade</p>
                  <p className="text-xl font-medium">{gradesData.current}%</p>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(gradesData.current), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-4">Loading grade records...</div>
          ) : gradesData?.records?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Assessment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradesData.records.map((record: any) => (
                    <TableRow key={record.id} className="border-b border-gray-200">
                      <TableCell>{record.assessment}</TableCell>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell className="font-medium">{record.grade}%</TableCell>
                      <TableCell>{record.comment || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">No grade records found.</div>
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

export default GradesModal;
