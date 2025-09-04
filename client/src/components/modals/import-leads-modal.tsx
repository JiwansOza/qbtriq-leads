import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, FileText, MapPin } from "lucide-react";

interface ImportLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportLeadsModal({ open, onOpenChange }: ImportLeadsModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<any[] | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const targetFields = [
    { value: 'name', label: 'Lead Name' },
    { value: 'email', label: 'Email Address' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'company', label: 'Company' },
    { value: 'position', label: 'Position' },
    { value: 'source', label: 'Source' },
    { value: 'notes', label: 'Notes' },
    { value: 'value', label: 'Expected Value' },
  ];

  const mutation = useMutation({
    mutationFn: async (data: { leads: any[], fieldMapping: Record<string, string> }) => {
      await apiRequest("POST", "/api/leads/import", data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/leads"] });
      toast({
        title: "Success",
        description: `Successfully imported ${response.count} leads`,
      });
      handleClose();
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
        description: "Failed to import leads",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid File",
        description: "Please select a JSON file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data)) {
          throw new Error("JSON must contain an array of objects");
        }
        
        setJsonData(data);
        
        // Auto-detect field mappings
        if (data.length > 0) {
          const sampleObject = data[0];
          const detectedMapping: Record<string, string> = {};
          
          Object.keys(sampleObject).forEach(key => {
            const lowerKey = key.toLowerCase();
            
            if (lowerKey.includes('name') || lowerKey === 'full_name' || lowerKey === 'fullname') {
              detectedMapping[key] = 'name';
            } else if (lowerKey.includes('email') || lowerKey === 'email_address') {
              detectedMapping[key] = 'email';
            } else if (lowerKey.includes('phone') || lowerKey === 'phone_number' || lowerKey === 'mobile') {
              detectedMapping[key] = 'phone';
            } else if (lowerKey.includes('company') || lowerKey === 'organization') {
              detectedMapping[key] = 'company';
            } else if (lowerKey.includes('position') || lowerKey === 'job_title' || lowerKey === 'title') {
              detectedMapping[key] = 'position';
            } else if (lowerKey.includes('source') || lowerKey === 'lead_source') {
              detectedMapping[key] = 'source';
            } else if (lowerKey.includes('note') || lowerKey === 'comment' || lowerKey === 'description') {
              detectedMapping[key] = 'notes';
            } else if (lowerKey.includes('value') || lowerKey === 'deal_value' || lowerKey === 'amount') {
              detectedMapping[key] = 'value';
            }
          });
          
          setFieldMapping(detectedMapping);
        }
        
        setStep('mapping');
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Failed to parse JSON file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!jsonData || !fieldMapping) return;
    
    mutation.mutate({
      leads: jsonData,
      fieldMapping,
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setJsonData(null);
    setFieldMapping({});
    setStep('upload');
    onOpenChange(false);
  };

  const sourceFields = jsonData && jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" data-testid="import-leads-modal">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            Import leads from a JSON file with automatic field mapping
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload JSON File
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Drag and drop your JSON file here, or
                </p>
                <div className="space-y-2">
                  <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()} data-testid="button-browse-files">
                    Browse Files
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                </div>
              </div>
            </div>

            {selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Selected File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium" data-testid="selected-file-name">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {jsonData?.length || 0} records detected
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 'mapping' && jsonData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Field Mapping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Map the fields from your JSON file to the CRM fields. Auto-detected mappings are shown below.
                </p>
                <div className="space-y-3">
                  {sourceFields.map((sourceField) => (
                    <div key={sourceField} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-mono text-sm">{sourceField}</span>
                        <p className="text-xs text-muted-foreground">
                          Sample: {JSON.stringify(jsonData[0][sourceField]).slice(0, 50)}...
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">→</span>
                        <Select
                          value={fieldMapping[sourceField] || ""}
                          onValueChange={(value) => {
                            setFieldMapping(prev => ({
                              ...prev,
                              [sourceField]: value
                            }));
                          }}
                        >
                          <SelectTrigger className="w-40" data-testid={`select-mapping-${sourceField}`}>
                            <SelectValue placeholder="Skip field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">Skip field</SelectItem>
                            {targetFields.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')} data-testid="button-back-upload">
                Back
              </Button>
              <Button onClick={() => setStep('preview')} data-testid="button-preview-import">
                Preview Import
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && jsonData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Records:</span>
                      <span className="font-medium ml-2" data-testid="preview-total-records">{jsonData.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mapped Fields:</span>
                      <span className="font-medium ml-2" data-testid="preview-mapped-fields">
                        {Object.values(fieldMapping).filter(Boolean).length}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">Sample Records:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {jsonData.slice(0, 3).map((record, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded border text-xs">
                          {Object.entries(fieldMapping)
                            .filter(([_, target]) => target)
                            .map(([source, target]) => (
                              <div key={source} className="flex justify-between py-1">
                                <span className="text-muted-foreground">{target}:</span>
                                <span className="font-mono" data-testid={`preview-field-${index}-${target}`}>
                                  {record[source] || '-'}
                                </span>
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('mapping')} data-testid="button-back-mapping">
                Back to Mapping
              </Button>
              <Button 
                onClick={handleImport}
                disabled={mutation.isPending || Object.values(fieldMapping).filter(Boolean).length === 0}
                data-testid="button-confirm-import"
              >
                {mutation.isPending ? "Importing..." : `Import ${jsonData.length} Leads`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
