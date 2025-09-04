import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Upload, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AddLeadModal from "@/components/modals/add-lead-modal";
import EditLeadModal from "@/components/modals/edit-lead-modal";
import ImportLeadsModal from "@/components/modals/import-leads-modal";

export default function Leads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["/api/leads", searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== "all") params.append('status', statusFilter);
      
      const response = await fetch(`/api/leads?${params}`);
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      await apiRequest("DELETE", `/api/leads/${leadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/leads"] });
      toast({
        title: "Success",
        description: "Lead deleted successfully",
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
        description: "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

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

  const handleDelete = (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteMutation.mutate(leadId);
    }
  };

  return (
    <div className="space-y-6" data-testid="leads-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground">Leads</h2>
          <p className="text-muted-foreground">
            Manage and track your sales leads
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
          <Button onClick={() => setShowAddModal(true)} data-testid="button-add-lead">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-leads"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads ({leads?.length || 0})</CardTitle>
          <CardDescription>
            {user?.role === 'admin' 
              ? "Manage all leads in the system" 
              : "Manage your assigned leads"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-leads">
              Loading leads...
            </div>
          ) : leads && leads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead: any) => (
                  <TableRow key={lead.id} data-testid={`lead-row-${lead.id}`}>
                    <TableCell className="font-medium" data-testid={`lead-name-${lead.id}`}>
                      {lead.name}
                    </TableCell>
                    <TableCell data-testid={`lead-company-${lead.id}`}>
                      {lead.company || '-'}
                    </TableCell>
                    <TableCell data-testid={`lead-email-${lead.id}`}>
                      {lead.email || '-'}
                    </TableCell>
                    <TableCell data-testid={`lead-phone-${lead.id}`}>
                      {lead.phone || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)} data-testid={`lead-status-${lead.id}`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`lead-assignee-${lead.id}`}>
                      {lead.assignedUser 
                        ? `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}`
                        : 'Unassigned'
                      }
                    </TableCell>
                    <TableCell data-testid={`lead-created-${lead.id}`}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingLead(lead)}
                          data-testid={`button-edit-${lead.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(lead.id)}
                          data-testid={`button-delete-${lead.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-leads-message">
              {searchQuery || statusFilter 
                ? "No leads found matching your filters."
                : "No leads found. Add your first lead to get started."
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddLeadModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
      />
      <EditLeadModal 
        lead={editingLead}
        open={!!editingLead} 
        onOpenChange={(open) => !open && setEditingLead(null)} 
      />
      <ImportLeadsModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal} 
      />
    </div>
  );
}
