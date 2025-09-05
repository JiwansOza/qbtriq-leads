import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Clock, Activity } from "lucide-react";
import { SignIn } from "@clerk/clerk-react";
import { Mail, ShieldCheck, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const handleLogin = () => setShowLogin(true);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-indigo-100 via-blue-50 to-white relative" data-testid="landing-page">
      {/* Hero Background Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="w-full h-96 bg-gradient-to-r from-indigo-400/30 to-blue-300/10 blur-2xl"></div>
      </div>
      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Navbar */}
        {/* Removed navbar login button as requested */}
        {/* Hero Section */}
        <div className="text-center mb-24">
          <div className="flex flex-col md:flex-row items-center justify-center mb-8 gap-4">
            <img src="/src/assets/qbtriq-logo.png" alt="Qbtriq Logo" width={80} height={80} className="drop-shadow-lg" style={{background: 'transparent'}} />
            <h1 className="text-5xl font-extrabold text-primary tracking-tight drop-shadow-lg md:ml-6 mt-4 md:mt-0">Qbtriq CRM</h1>
          </div>
          <h2 className="text-6xl font-bold text-gray-900 mb-8 leading-tight drop-shadow">
            Accelerate Your Sales Growth
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-10">
            The all-in-one CRM platform to manage leads, empower your team, and drive conversions. Modern, secure, and built for results.
          </p>
          <Button size="lg" className="px-10 py-5 text-xl font-bold shadow-xl hover:scale-105 transition-transform" onClick={handleLogin}>
            Login
          </Button>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-24">
          <Card className="hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent hover:border-primary">
            <CardHeader className="text-center">
              <Users className="w-14 h-14 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl font-semibold">Lead Management</CardTitle>
              <CardDescription>
                Track and manage your sales leads with advanced filtering and status tracking.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent hover:border-secondary">
            <CardHeader className="text-center">
              <Users className="w-14 h-14 text-secondary mx-auto mb-4" />
              <CardTitle className="text-2xl font-semibold">Team Management</CardTitle>
              <CardDescription>
                Manage your sales team with role-based access and performance tracking.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent hover:border-accent">
            <CardHeader className="text-center">
              <Clock className="w-14 h-14 text-accent mx-auto mb-4" />
              <CardTitle className="text-2xl font-semibold">Attendance Tracking</CardTitle>
              <CardDescription>
                Monitor team attendance with GPS-enabled punch-in/out system.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent hover:border-destructive">
            <CardHeader className="text-center">
              <Activity className="w-14 h-14 text-destructive mx-auto mb-4" />
              <CardTitle className="text-2xl font-semibold">Activity Logs</CardTitle>
              <CardDescription>
                Complete audit trail of all activities and lead interactions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Trust Section */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-24">
          <div className="flex items-center gap-3 text-lg text-gray-700">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Enterprise-grade security
          </div>
          <div className="flex items-center gap-3 text-lg text-gray-700">
            <Star className="w-6 h-6 text-yellow-500" />
            Trusted by sales teams
          </div>
          <div className="flex items-center gap-3 text-lg text-gray-700">
            <Mail className="w-6 h-6 text-blue-500" />
            24/7 support
          </div>
        </div>
      </div>
      {/* Login Modal Popup */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="max-w-md mx-auto shadow-2xl border-2 border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">Get Started Today</DialogTitle>
            <CardDescription>
              Sign in to access your CRM dashboard and start managing your leads effectively.
            </CardDescription>
          </DialogHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                    card: "shadow-none",
                  },
                }}
              />
              <div className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Secure authentication powered by Clerk
              </div>
            </div>
          </CardContent>
        </DialogContent>
      </Dialog>
      {/* Footer */}
      <footer className="bg-white border-t py-8 text-center text-gray-500 text-base shadow-inner">
        &copy; {new Date().getFullYear()} Qbtriq CRM. All rights reserved.
      </footer>
    </div>
  );
}
