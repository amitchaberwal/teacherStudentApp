import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { School } from "lucide-react";
import { useLocation } from "wouter";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <School className="mr-2" />
          <h1 className="text-xl md:text-2xl font-medium">EduConnect</h1>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center">
            <Avatar className="h-10 w-10 bg-accent text-white mr-2">
              <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
            </Avatar>
            <span className="mr-4 hidden md:inline">{user?.name}</span>
            <Button
              variant="secondary"
              className="text-primary"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        ) : (
          <></> //Removed Login Button
        )}
      </div>
    </header>
  );
};

export default Header;