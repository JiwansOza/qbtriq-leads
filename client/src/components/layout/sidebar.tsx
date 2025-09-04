import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BarChart3, 
  Home, 
  Users, 
  UserCheck, 
  Clock, 
  Activity, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import logoUrl from "@assets/favicon_1757010764824.png";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: leadStats } = useQuery({
    queryKey: ["/api/stats/leads"],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    {
      href: "/",
      icon: Home,
      label: "Dashboard",
      badge: null,
    },
    {
      href: "/leads",
      icon: Users,
      label: "Leads",
      badge: leadStats?.total || 0,
    },
    {
      href: "/team",
      icon: UserCheck,
      label: "Team",
      badge: null,
    },
    {
      href: "/attendance",
      icon: Clock,
      label: "Attendance",
      badge: null,
    },
    {
      href: "/activity-logs",
      icon: Activity,
      label: "Activity Logs",
      badge: null,
    },
  ];

  return (
    <div className="w-64 bg-card shadow-lg border-r border-border h-full flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <img 
            src={logoUrl} 
            alt="QBtriq Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Qbtriq CRM</h1>
            <p className="text-xs text-muted-foreground">Lead Management</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback>
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground" data-testid="user-name">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize" data-testid="user-role">
              {user?.role}
            </p>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full" data-testid="user-status" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors w-full text-left cursor-pointer",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                data-testid={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium flex-1">{item.label}</span>
                {item.badge !== null && item.badge > 0 && (
                  <Badge 
                    variant={active ? "secondary" : "default"}
                    className="ml-auto"
                    data-testid={`nav-badge-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {item.badge}
                  </Badge>
                )}
                {active && <ChevronRight className="w-4 h-4" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
