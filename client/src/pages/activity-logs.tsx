import { useAuthenticatedQuery } from "@/hooks/useAuthenticatedQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, UserPlus, Edit, Trash2, Upload, LogIn, LogOut } from "lucide-react";
import type { ActivityLogWithUser } from "@shared/schema";

export default function ActivityLogs() {
  const { data: activities, isLoading } = useAuthenticatedQuery<ActivityLogWithUser[]>(
    ["/api/activity-logs"],
    "/api/activity-logs"
  );

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "created_lead": return <UserPlus className="w-4 h-4" />;
      case "updated_lead": return <Edit className="w-4 h-4" />;
      case "deleted_lead": return <Trash2 className="w-4 h-4" />;
      case "imported_leads": return <Upload className="w-4 h-4" />;
      case "created_employee": return <User className="w-4 h-4" />;
      case "updated_employee": return <Edit className="w-4 h-4" />;
      case "punched_in": return <LogIn className="w-4 h-4" />;
      case "punched_out": return <LogOut className="w-4 h-4" />;
      case "uploaded_document": return <Upload className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "created_lead":
      case "created_employee": 
        return "bg-green-100 text-green-800";
      case "updated_lead":
      case "updated_employee": 
        return "bg-blue-100 text-blue-800";
      case "deleted_lead": 
        return "bg-red-100 text-red-800";
      case "imported_leads":
      case "uploaded_document": 
        return "bg-purple-100 text-purple-800";
      case "punched_in":
      case "punched_out": 
        return "bg-yellow-100 text-yellow-800";
      default: 
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActivityDescription = (activity: any) => {
    const { action, details } = activity;
    
    switch (action) {
      case "created_lead":
        return `Created lead "${details?.leadName}"`;
      case "updated_lead":
        return `Updated lead "${details?.leadName}"`;
      case "deleted_lead":
        return `Deleted lead "${details?.leadName}"`;
      case "imported_leads":
        return `Imported ${details?.count} leads`;
      case "created_employee":
        return `Created employee with ID "${details?.employeeId}"`;
      case "updated_employee":
        return `Updated employee with ID "${details?.employeeId}"`;
      case "punched_in":
        return details?.location 
          ? `Punched in at ${details.location.address || 'location'}`
          : "Punched in";
      case "punched_out":
        return details?.totalHours 
          ? `Punched out (${parseFloat(details.totalHours).toFixed(2)}h worked)`
          : "Punched out";
      case "uploaded_document":
        return `Uploaded document "${details?.fileName}"`;
      default:
        return formatAction(action);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6" data-testid="activity-logs-page">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-foreground">Activity Logs</h2>
        <p className="text-muted-foreground">
          Track all activities and changes in the system
        </p>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Complete audit trail of all user activities and system changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-activities">
              Loading activity logs...
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity: any, index: number) => (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg border"
                  data-testid={`activity-item-${activity.id}`}
                >
                  {/* User Avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={activity.user.profileImageUrl} />
                    <AvatarFallback>
                      {getInitials(activity.user.firstName, activity.user.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-foreground" data-testid={`activity-user-${activity.id}`}>
                            {activity.user.firstName} {activity.user.lastName}
                          </span>
                          <Badge className={getActivityColor(activity.action)} data-testid={`activity-action-${activity.id}`}>
                            <span className="mr-1">{getActivityIcon(activity.action)}</span>
                            {formatAction(activity.action)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`activity-description-${activity.id}`}>
                          {getActivityDescription(activity)}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span data-testid={`activity-time-${activity.id}`}>
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                          <span data-testid={`activity-entity-${activity.id}`}>
                            {activity.entityType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="mt-2 p-2 bg-background rounded border text-xs">
                        <details>
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs overflow-x-auto" data-testid={`activity-details-${activity.id}`}>
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>

                  {/* Timeline connector */}
                  {index < activities.length - 1 && (
                    <div className="absolute left-9 mt-12 w-px h-8 bg-border" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-activities-message">
              No activities found. Activities will appear here as users interact with the system.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
