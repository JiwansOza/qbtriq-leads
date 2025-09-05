import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserPlus, Mail, Phone, Building, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AddEmployeeModal from "@/components/modals/add-employee-modal";
import type { UserWithEmployee } from "@shared/schema";

export default function Team() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: employees, isLoading } = useQuery<UserWithEmployee[]>({
    queryKey: ["/api/employees"],
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6" data-testid="team-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground">Team</h2>
          <p className="text-muted-foreground">
            Manage your team members and their information
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddModal(true)} data-testid="button-add-employee">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-employees">
              {employees?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-today">
              {employees?.filter((emp: any) => emp.isActive).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-departments">
              {new Set(employees?.map((emp: any) => emp.employee?.department).filter(Boolean)).size || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            All team members and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-employees">
              Loading team members...
            </div>
          ) : employees && employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee: any) => (
                  <TableRow key={employee.id} data-testid={`employee-row-${employee.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={employee.profileImageUrl} alt={`${employee.firstName} ${employee.lastName}`} />
                          <AvatarFallback>
                            {getInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium" data-testid={`employee-name-${employee.id}`}>
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`employee-email-${employee.id}`}>
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`employee-id-${employee.id}`}>
                      {employee.employee?.employeeId || '-'}
                    </TableCell>
                    <TableCell data-testid={`employee-department-${employee.id}`}>
                      {employee.employee?.department || '-'}
                    </TableCell>
                    <TableCell data-testid={`employee-position-${employee.id}`}>
                      {employee.employee?.position || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {employee.employee?.phone && (
                          <div className="flex items-center text-sm" data-testid={`employee-phone-${employee.id}`}>
                            <Phone className="w-3 h-3 mr-1" />
                            {employee.employee.phone}
                          </div>
                        )}
                        {employee.email && (
                          <div className="flex items-center text-sm" data-testid={`employee-email-contact-${employee.id}`}>
                            <Mail className="w-3 h-3 mr-1" />
                            {employee.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`employee-joining-${employee.id}`}>
                      {employee.employee?.joiningDate 
                        ? new Date(employee.employee.joiningDate).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={employee.employee?.isActive ? "default" : "secondary"}
                        data-testid={`employee-status-${employee.id}`}
                      >
                        {employee.employee?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-employees-message">
              No team members found. {isAdmin && "Add your first employee to get started."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      {isAdmin && (
        <AddEmployeeModal 
          open={showAddModal} 
          onOpenChange={setShowAddModal} 
        />
      )}
    </div>
  );
}
