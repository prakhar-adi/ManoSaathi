import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  Users, 
  BarChart3,
  Heart,
  Menu,
  X,
  LogIn,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationSystem from "./NotificationSystem";

const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navItems = [
    { path: "/", icon: Heart, label: "Dashboard", description: "Main overview" },
    { path: "/chat", icon: MessageSquare, label: "AI Support", description: "Talk to our AI counselor" },
    { path: "/resources", icon: BookOpen, label: "Resources", description: "Mental health guides" },
    { path: "/booking", icon: Calendar, label: "Book Session", description: "Schedule counseling" },
    { path: "/peer-support", icon: Users, label: "Peer Support", description: "Connect with others" },
    { path: "/admin", icon: BarChart3, label: "Analytics", description: "Dashboard insights" },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-foreground">ManoSaathi</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {user ? (
                <>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <Link key={item.path} to={item.path}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className="flex items-center space-x-2 h-10"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden lg:inline">{item.label}</span>
                        </Button>
                      </Link>
                    );
                  })}
                  <NotificationSystem />
                  <Button
                    variant="ghost"
                    onClick={signOut}
                    className="flex items-center space-x-2 h-10 text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden lg:inline">Sign Out</span>
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button className="flex items-center space-x-2 h-10">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden lg:inline">Sign In</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 right-4 z-50 bg-primary text-primary-foreground p-2 rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            {user ? (
              <>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex flex-col items-center space-y-2 p-4 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-8 w-8" />
                      <span className="font-medium">{item.label}</span>
                      <span className="text-sm opacity-70">{item.description}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center space-y-2 p-4 rounded-lg transition-colors hover:bg-accent text-red-600"
                >
                  <LogOut className="h-8 w-8" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex flex-col items-center space-y-2 p-4 rounded-lg transition-colors hover:bg-accent"
              >
                <LogIn className="h-8 w-8" />
                <span className="font-medium">Sign In</span>
                <span className="text-sm opacity-70">Access your account</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Spacer for fixed navigation */}
      <div className="h-16 md:h-20"></div>
    </>
  );
};

export default Navigation;