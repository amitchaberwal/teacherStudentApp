import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { useLocation } from "wouter";
import { User, Bookmark, BookmarkPlus, Plus, Search, MoreVertical, GraduationCap, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AttendanceModal from "./attendance-modal";
import GradesModal from "./grades-modal";
import JoinClass from "./join-class";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-classes");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [bookmarkedClasses, setBookmarkedClasses] = useState<number[]>([]);

  const { data: enrolledClasses, isLoading, error } = useQuery({
    queryKey: ['/api/enrollments', user?.id],
    queryFn: () => 
      fetch(`/api/enrollments?studentId=${user?.id}`).then((res) => {
        if (!res.ok) throw new Error("Failed to load classes");
        return res.json();
      }),
    enabled: !!user?.id,
  });

  const handleBookmarkToggle = (classId: number) => {
    if (bookmarkedClasses.includes(classId)) {
      setBookmarkedClasses(bookmarkedClasses.filter(id => id !== classId));
      toast({
        title: "Bookmark removed",
        description: "Class has been removed from bookmarks",
      });
    } else {
      setBookmarkedClasses([...bookmarkedClasses, classId]);
      toast({
        title: "Bookmark added",
        description: "Class has been added to bookmarks",
      });
    }
  };

  const handleAttendanceClick = (classItem: any) => {
    setSelectedClass(classItem);
    setIsAttendanceModalOpen(true);
  };

  const handleGradesClick = (classItem: any) => {
    setSelectedClass(classItem);
    setIsGradesModalOpen(true);
  };

  const filteredClasses = enrolledClasses?.filter((classItem: any) => 
    classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-2">Student Dashboard</h2>
          <p className="text-gray-600">View your classes, attendance and grades</p>
        </div>
        
        <Tabs defaultValue="my-classes" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 border-b border-gray-200 w-full justify-start">
            <TabsTrigger value="my-classes">My Classes</TabsTrigger>
            <TabsTrigger value="join-class">Join Class</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-classes">
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
                <Button onClick={() => setActiveTab("join-class")}>
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Join Class</span>
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
                {filteredClasses?.map((classItem: any) => (
                  <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium">{classItem.name}</h4>
                        <div className="flex items-center">
                          {bookmarkedClasses.includes(classItem.id) ? (
                            <Bookmark 
                              className="h-5 w-5 text-primary cursor-pointer mr-2"
                              onClick={() => handleBookmarkToggle(classItem.id)}
                            />
                          ) : (
                            <BookmarkPlus 
                              className="h-5 w-5 text-gray-400 cursor-pointer hover:text-primary mr-2"
                              onClick={() => handleBookmarkToggle(classItem.id)}
                            />
                          )}
                          <MoreVertical className="h-5 w-5 text-gray-400 cursor-pointer hover:text-primary" />
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{classItem.description}</p>
                      <div className="flex items-center mb-4">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">{classItem.teacher}</span>
                      </div>
                      <div className="flex space-x-2 mb-4">
                        <div className="flex-1 bg-gray-100 p-3 rounded text-center">
                          <p className="text-sm text-gray-600 mb-1">Attendance</p>
                          <p className="font-medium">{classItem.attendance}</p>
                        </div>
                        <div className="flex-1 bg-gray-100 p-3 rounded text-center">
                          <p className="text-sm text-gray-600 mb-1">Current Grade</p>
                          <p className="font-medium">{classItem.grade}</p>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button variant="ghost" className="text-primary">
                          View Details
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
                
                {/* Join Class Card */}
                <Card className="border-dashed border-2 border-gray-300 hover:shadow-lg transition-shadow">
                  <CardContent className="flex flex-col items-center justify-center min-h-[16rem] p-6">
                    <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-center text-gray-600 mb-4">Join a new class</p>
                    <Button onClick={() => setActiveTab("join-class")}>
                      Join Class
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="join-class">
            <JoinClass onSuccess={() => setActiveTab("my-classes")} />
          </TabsContent>
        </Tabs>
      </div>

      {selectedClass && (
        <>
          <AttendanceModal 
            isOpen={isAttendanceModalOpen} 
            onClose={() => setIsAttendanceModalOpen(false)} 
            classData={selectedClass} 
            studentId={user?.id}
          />
          
          <GradesModal 
            isOpen={isGradesModalOpen} 
            onClose={() => setIsGradesModalOpen(false)} 
            classData={selectedClass}
            studentId={user?.id}
          />
        </>
      )}
    </>
  );
};

export default StudentDashboard;
