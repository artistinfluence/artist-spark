import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkMemberImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportMember {
  name: string;
  primary_email: string;
  soundcloud_url: string;
  additional_emails?: string[];
  size_tier?: 'T1' | 'T2' | 'T3' | 'T4';
  monthly_repost_limit?: number;
}

interface ImportResult {
  member: ImportMember;
  success: boolean;
  error?: string;
  analysis?: any;
}

export const BulkMemberImport: React.FC<BulkMemberImportProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [csvText, setCsvText] = useState('');
  const [members, setMembers] = useState<ImportMember[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'input' | 'validate' | 'process' | 'complete'>('input');

  const validateUrl = (url: string) => {
    return /^https?:\/\/(www\.)?soundcloud\.com\/.+/.test(url);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const parseCsvText = () => {
    if (!csvText.trim()) {
      toast({
        title: "No data",
        description: "Please enter CSV data or paste member information",
        variant: "destructive"
      });
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const requiredHeaders = ['name', 'email', 'soundcloud_url'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast({
          title: "Missing headers",
          description: `Required headers: ${missingHeaders.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      const parsedMembers: ImportMember[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const member: ImportMember = {
          name: '',
          primary_email: '',
          soundcloud_url: ''
        };

        headers.forEach((header, index) => {
          const value = values[index];
          if (!value) return;

          switch (header) {
            case 'name':
              member.name = value;
              break;
            case 'email':
              member.primary_email = value;
              break;
            case 'soundcloud_url':
              member.soundcloud_url = value;
              break;
            case 'additional_emails':
              member.additional_emails = value.split(';').map(e => e.trim());
              break;
            case 'size_tier':
              if (['T1', 'T2', 'T3', 'T4'].includes(value)) {
                member.size_tier = value as 'T1' | 'T2' | 'T3' | 'T4';
              }
              break;
            case 'monthly_limit':
              const limit = parseInt(value);
              if (!isNaN(limit)) {
                member.monthly_repost_limit = limit;
              }
              break;
          }
        });

        if (member.name && member.primary_email && member.soundcloud_url) {
          parsedMembers.push(member);
        }
      }

      setMembers(parsedMembers);
      setCurrentStep('validate');
      
      toast({
        title: "Data parsed",
        description: `Found ${parsedMembers.length} valid members to import`,
      });
    } catch (error) {
      toast({
        title: "Parse error",
        description: "Failed to parse CSV data. Please check format.",
        variant: "destructive"
      });
    }
  };

  const validateMembers = () => {
    const validationErrors: string[] = [];
    
    members.forEach((member, index) => {
      if (!validateEmail(member.primary_email)) {
        validationErrors.push(`Row ${index + 1}: Invalid email format`);
      }
      if (!validateUrl(member.soundcloud_url)) {
        validationErrors.push(`Row ${index + 1}: Invalid SoundCloud URL format`);
      }
    });

    if (validationErrors.length > 0) {
      toast({
        title: "Validation errors",
        description: `${validationErrors.length} errors found. Check data format.`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const processImport = async () => {
    if (!validateMembers()) return;

    setIsProcessing(true);
    setCurrentStep('process');
    setProgress(0);
    
    const importResults: ImportResult[] = [];
    
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      
      try {
        // First analyze SoundCloud profile
        const { data: analysisData } = await supabase.functions.invoke('analyze-soundcloud-profile', {
          body: { soundcloudUrl: member.soundcloud_url }
        });

        // Prepare member data
        const emails = [member.primary_email];
        if (member.additional_emails?.length) {
          emails.push(...member.additional_emails);
        }

        const memberData = {
          name: member.name,
          primary_email: member.primary_email,
          emails: emails,
          soundcloud_url: member.soundcloud_url,
          soundcloud_followers: analysisData?.success ? analysisData.followers || 0 : 0,
          monthly_repost_limit: member.monthly_repost_limit || 1,
          size_tier: member.size_tier || 'T1',
          status: 'active' as const
        };

        const { error } = await supabase
          .from('members')
          .insert(memberData);

        if (error) throw error;

        importResults.push({
          member,
          success: true,
          analysis: analysisData
        });

      } catch (error: any) {
        importResults.push({
          member,
          success: false,
          error: error.message || 'Unknown error'
        });
      }

      setProgress(((i + 1) / members.length) * 100);
    }

    setResults(importResults);
    setCurrentStep('complete');
    setIsProcessing(false);

    const successCount = importResults.filter(r => r.success).length;
    const failCount = importResults.length - successCount;

    toast({
      title: "Import complete",
      description: `${successCount} members imported successfully. ${failCount} failed.`,
      variant: successCount > 0 ? "default" : "destructive"
    });

    if (successCount > 0) {
      onSuccess();
    }
  };

  const downloadTemplate = () => {
    const template = `name,email,soundcloud_url,additional_emails,size_tier,monthly_limit
Artist Name,artist@example.com,https://soundcloud.com/artist-name,backup@example.com,T2,2
Another Artist,another@example.com,https://soundcloud.com/another-artist,,T1,1`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setCsvText('');
    setMembers([]);
    setResults([]);
    setProgress(0);
    setCurrentStep('input');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Members
          </DialogTitle>
        </DialogHeader>

        {/* Input Step */}
        {currentStep === 'input' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Import CSV Data</h3>
                <p className="text-sm text-muted-foreground">
                  Paste your CSV data or upload member information
                </p>
              </div>
              <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </div>
            
            <div>
              <Label htmlFor="csvText">CSV Data</Label>
              <Textarea
                id="csvText"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="name,email,soundcloud_url,additional_emails,size_tier,monthly_limit&#10;Artist Name,artist@example.com,https://soundcloud.com/artist-name,backup@example.com,T2,2"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Required columns: name, email, soundcloud_url. Optional: additional_emails (semicolon separated), size_tier (T1-T4), monthly_limit
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={parseCsvText} disabled={!csvText.trim()}>
                Parse Data
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Validate Step */}
        {currentStep === 'validate' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Validate Import Data</h3>
              <p className="text-sm text-muted-foreground">
                Review {members.length} members before import
              </p>
            </div>

            <ScrollArea className="h-64 border rounded-md p-4">
              <div className="space-y-3">
                {members.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.primary_email}</p>
                      <p className="text-xs text-muted-foreground">{member.soundcloud_url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {validateEmail(member.primary_email) && validateUrl(member.soundcloud_url) ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Invalid
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button onClick={processImport}>
                Start Import
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep('input')}>
                Back to Edit
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Process Step */}
        {currentStep === 'process' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Processing Import</h3>
              <p className="text-sm text-muted-foreground">
                Analyzing SoundCloud profiles and creating member accounts...
              </p>
            </div>

            <div className="space-y-4">
              <Progress value={progress} />
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Import Complete</h3>
              <p className="text-sm text-muted-foreground">
                {results.filter(r => r.success).length} of {results.length} members imported successfully
              </p>
            </div>

            <ScrollArea className="h-64 border rounded-md p-4">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{result.member.name}</p>
                      <p className="text-sm text-muted-foreground">{result.member.primary_email}</p>
                      {result.error && (
                        <p className="text-xs text-destructive">{result.error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button onClick={() => { resetImport(); onClose(); }}>
                Close
              </Button>
              <Button variant="outline" onClick={resetImport}>
                Import More Members
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};