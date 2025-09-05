import { useAuthenticatedQuery } from "@/hooks/useAuthenticatedQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Clock, UserCheck, Plus, Upload, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import AddLeadModal from "@/components/modals/add-lead-modal";
import ImportLeadsModal from "@/components/modals/import-leads-modal";
import type { Lead, ActivityLog } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: leadStats } = useAuthenticatedQuery<{ total: number; converted: number; [key: string]: number }>(
    ["/api/stats/leads"],
    "/api/stats/leads"
  );

  const { data: attendanceStats } = useAuthenticatedQuery<{ totalEmployees: number; presentToday: number; attendanceRate: number }>(
    ["/api/stats/attendance"],
    "/api/stats/attendance"
  );

  const { data: recentLeads } = useAuthenticatedQuery<Lead[]>(
    ["/api/leads"],
    "/api/leads"
  );

  const { data: recentActivities } = useAuthenticatedQuery<ActivityLog[]>(
    ["/api/activity-logs"],
    "/api/activity-logs"
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-yellow-100 text-yellow-800";
      case "CONTACTED": return "bg-blue-100 text-blue-800";
      case "FOLLOW_UP": return "bg-purple-100 text-purple-800";
      case "NOT_INTERESTED": return "bg-red-100 text-red-800";
      case "CONVERTED": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "created_lead": return "👤";
      case "updated_lead": return "✏️";
      case "punched_in": return "🕐";
      case "punched_out": return "🕕";
      default: return "📝";
    }
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || 'User'}! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowImportModal(true)}
            data-testid="button-import-leads"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Leads
          </Button>
          <Button onClick={() => setShowAddLeadModal(true)} data-testid="button-add-lead">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-leads">
              {leadStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-converted">
              {leadStats?.converted || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {leadStats?.total && leadStats?.total > 0 ? Math.round((leadStats.converted / leadStats.total) * 100) : 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-team-members">
              {attendanceStats?.totalEmployees || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats?.presentToday || 0} online now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-attendance-rate">
              {attendanceStats?.attendanceRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Leads</CardTitle>
              <Button variant="ghost" size="sm" data-testid="link-view-all-leads">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLeads?.slice(0, 5).map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg" data-testid={`lead-item-${lead.id}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-secondary-foreground font-medium text-sm">
                      {lead.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground" data-testid={`lead-name-${lead.id}`}>
                      {lead.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`lead-company-${lead.id}`}>
                      {lead.company || 'No company'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(lead.status)} data-testid={`lead-status-${lead.id}`}>
                    {lead.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {(!recentLeads || recentLeads.length === 0) && (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-leads-message">
                No leads found. Add your first lead to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Activity</CardTitle>
              <Button variant="ghost" size="sm" data-testid="link-view-all-activity">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities?.slice(0, 6).map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-item-${activity.id}`}>
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">
                    {getActivityIcon(activity.action)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium" data-testid={`activity-user-${activity.id}`}>
                      {activity.user.firstName} {activity.user.lastName}
                    </span>{' '}
                    {activity.action.replace('_', ' ')}
                    {activity.details?.leadName && (
                      <span className="font-medium"> {activity.details.leadName}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`activity-time-${activity.id}`}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {(!recentActivities || recentActivities.length === 0) && (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-activity-message">
                No recent activity found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { key: 'new', label: 'NEW', color: 'bg-yellow-100 text-yellow-800' },
              { key: 'contacted', label: 'CONTACTED', color: 'bg-blue-100 text-blue-800' },
              { key: 'followUp', label: 'FOLLOW UP', color: 'bg-purple-100 text-purple-800' },
              { key: 'notInterested', label: 'NOT INTERESTED', color: 'bg-red-100 text-red-800' },
              { key: 'converted', label: 'CONVERTED', color: 'bg-green-100 text-green-800' },
            ].map(({ key, label, color }) => (
              <div key={key} className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-foreground" data-testid={`status-count-${key}`}>
                    {(leadStats as any)?.[key] || 0}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {leadStats?.total && leadStats?.total > 0 ? Math.round(((leadStats as any)?.[key] / leadStats.total) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddLeadModal 
        open={showAddLeadModal} 
        onOpenChange={setShowAddLeadModal} 
      />
      <ImportLeadsModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal} 
      />
    </div>
  );
}
