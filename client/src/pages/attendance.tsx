import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin, Calendar, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState<{lat: number, lng: number, address?: string} | null>(null);

  const { data: todayAttendance } = useQuery({
    queryKey: ["/api/attendance/today"],
  });

  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ["/api/attendance"],
  });

  const punchInMutation = useMutation({
    mutationFn: async (location?: {lat: number, lng: number, address?: string}) => {
      await apiRequest("POST", "/api/attendance/punch-in", { location });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/attendance"] });
      toast({
        title: "Success",
        description: "Punched in successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to punch in",
        variant: "destructive",
      });
    },
  });

  const punchOutMutation = useMutation({
    mutationFn: async (location?: {lat: number, lng: number, address?: string}) => {
      await apiRequest("POST", "/api/attendance/punch-out", { location });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/attendance"] });
      toast({
        title: "Success",
        description: "Punched out successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to punch out",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    return new Promise<{lat: number, lng: number}>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const handlePunchIn = async () => {
    try {
      const location = await getCurrentLocation();
      setLocation(location);
      punchInMutation.mutate(location);
    } catch (error) {
      // Punch in without location if geolocation fails
      punchInMutation.mutate();
    }
  };

  const handlePunchOut = async () => {
    try {
      const location = await getCurrentLocation();
      setLocation(location);
      punchOutMutation.mutate(location);
    } catch (error) {
      // Punch out without location if geolocation fails
      punchOutMutation.mutate();
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "late": return "bg-yellow-100 text-yellow-800";
      case "absent": return "bg-red-100 text-red-800";
      case "half_day": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isAdmin = user?.role === 'admin';
  const canPunchIn = !todayAttendance?.punchIn;
  const canPunchOut = todayAttendance?.punchIn && !todayAttendance?.punchOut;

  return (
    <div className="space-y-6" data-testid="attendance-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground">Attendance</h2>
          <p className="text-muted-foreground">
            Track attendance and working hours
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayAttendance ? (
              <div className="space-y-2">
                {todayAttendance.punchIn && (
                  <div className="flex items-center justify-between" data-testid="punch-in-time">
                    <span className="text-sm text-muted-foreground">Punch In:</span>
                    <span className="font-medium">{formatTime(todayAttendance.punchIn)}</span>
                  </div>
                )}
                {todayAttendance.punchOut && (
                  <div className="flex items-center justify-between" data-testid="punch-out-time">
                    <span className="text-sm text-muted-foreground">Punch Out:</span>
                    <span className="font-medium">{formatTime(todayAttendance.punchOut)}</span>
                  </div>
                )}
                {todayAttendance.totalHours && (
                  <div className="flex items-center justify-between" data-testid="total-hours">
                    <span className="text-sm text-muted-foreground">Total Hours:</span>
                    <span className="font-medium">{parseFloat(todayAttendance.totalHours).toFixed(2)}h</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground" data-testid="no-attendance-today">
                No attendance record for today
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LogIn className="w-5 h-5 mr-2" />
              Punch In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handlePunchIn}
              disabled={!canPunchIn || punchInMutation.isPending}
              className="w-full"
              data-testid="button-punch-in"
            >
              {punchInMutation.isPending ? "Punching In..." : "Punch In"}
            </Button>
            {!canPunchIn && todayAttendance?.punchIn && (
              <p className="text-xs text-muted-foreground mt-2">
                Already punched in today
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LogOut className="w-5 h-5 mr-2" />
              Punch Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handlePunchOut}
              disabled={!canPunchOut || punchOutMutation.isPending}
              variant="destructive"
              className="w-full"
              data-testid="button-punch-out"
            >
              {punchOutMutation.isPending ? "Punching Out..." : "Punch Out"}
            </Button>
            {!canPunchOut && !todayAttendance?.punchIn && (
              <p className="text-xs text-muted-foreground mt-2">
                Need to punch in first
              </p>
            )}
            {!canPunchOut && todayAttendance?.punchOut && (
              <p className="text-xs text-muted-foreground mt-2">
                Already punched out today
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {isAdmin 
              ? "View attendance records for all team members"
              : "View your attendance history"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-attendance">
              Loading attendance records...
            </div>
          ) : attendanceRecords && attendanceRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Employee</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead>Punch In</TableHead>
                  <TableHead>Punch Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record: any) => (
                  <TableRow key={record.id} data-testid={`attendance-row-${record.id}`}>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={record.user.profileImageUrl} />
                            <AvatarFallback>
                              {getInitials(record.user.firstName, record.user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm" data-testid={`attendance-user-${record.id}`}>
                              {record.user.firstName} {record.user.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell data-testid={`attendance-date-${record.id}`}>
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell data-testid={`attendance-punch-in-${record.id}`}>
                      {record.punchIn ? formatTime(record.punchIn) : '-'}
                    </TableCell>
                    <TableCell data-testid={`attendance-punch-out-${record.id}`}>
                      {record.punchOut ? formatTime(record.punchOut) : '-'}
                    </TableCell>
                    <TableCell data-testid={`attendance-hours-${record.id}`}>
                      {record.totalHours ? `${parseFloat(record.totalHours).toFixed(2)}h` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)} data-testid={`attendance-status-${record.id}`}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`attendance-location-${record.id}`}>
                      {record.punchInLocation ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1" />
                          {record.punchInLocation.address || `${record.punchInLocation.lat}, ${record.punchInLocation.lng}`}
                        </div>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-attendance-records">
              No attendance records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
