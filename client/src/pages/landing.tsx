import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Clock, Activity } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" data-testid="landing-page">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="text-primary-foreground text-xl" />
            </div>
            <h1 className="text-3xl font-bold text-primary ml-3">Qbtriq CRM</h1>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Lead Management System
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your sales process with our comprehensive CRM solution. 
            Manage leads, track team performance, and boost conversions.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>
                Track and manage your sales leads with advanced filtering and status tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Manage your sales team with role-based access and performance tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 text-accent mx-auto mb-4" />
              <CardTitle>Attendance Tracking</CardTitle>
              <CardDescription>
                Monitor team attendance with GPS-enabled punch-in/out system
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Activity className="w-12 h-12 text-destructive mx-auto mb-4" />
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Complete audit trail of all activities and lead interactions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Get Started Today</CardTitle>
              <CardDescription>
                Sign in to access your CRM dashboard and start managing your leads effectively
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogin} 
                className="w-full"
                data-testid="button-login"
              >
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
