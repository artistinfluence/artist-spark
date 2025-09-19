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
import { calculateRepostLimit, getFollowerTier } from '@/utils/creditCalculations';

interface BulkMemberImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportMember {
  stage_name: string;
  first_name?: string;
  email_1: string;
  email_2?: string;
  soundcloud_url: string;
  follower_count: number;
  // Auto-calculated fields
  size_tier: 'T1' | 'T2' | 'T3' | 'T4';
  monthly_repost_limit: number;
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
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/\s+/g, '_'));
      
      const requiredHeaders = ['stage_name', 'email_1', 'soundcloud_url', 'follower_count'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast({
          title: "Missing headers",
          description: `Required headers: ${missingHeaders.map(h => h.replace('_', ' ')).join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      const parsedMembers: ImportMember[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === 0 || values.every(v => !v)) continue; // Skip empty lines
        
        const memberData: Partial<ImportMember> = {};

        headers.forEach((header, index) => {
          const value = values[index];
          if (!value && !['first_name', 'email_2'].includes(header)) return;

          switch (header) {
            case 'stage_name':
              memberData.stage_name = value;
              break;
            case 'first_name':
              memberData.first_name = value || undefined;
              break;
            case 'email_1':
              memberData.email_1 = value;
              break;
            case 'email_2':
              memberData.email_2 = value || undefined;
              break;
            case 'soundcloud_url':
              memberData.soundcloud_url = value;
              break;
            case 'follower_count':
              const followerCount = parseInt(value.replace(/,/g, '')) || 0;
              memberData.follower_count = followerCount;
              // Auto-calculate tier and limit
              memberData.size_tier = getFollowerTier(followerCount).split(' ')[0] as 'T1' | 'T2' | 'T3' | 'T4';
              memberData.monthly_repost_limit = calculateRepostLimit(followerCount);
              break;
          }
        });

        // Validate required fields
        if (memberData.stage_name && memberData.email_1 && memberData.soundcloud_url && 
            memberData.follower_count !== undefined && memberData.size_tier && memberData.monthly_repost_limit) {
          parsedMembers.push(memberData as ImportMember);
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
      if (!validateEmail(member.email_1)) {
        validationErrors.push(`Row ${index + 1}: Invalid primary email format`);
      }
      if (member.email_2 && !validateEmail(member.email_2)) {
        validationErrors.push(`Row ${index + 1}: Invalid secondary email format`);
      }
      if (!validateUrl(member.soundcloud_url)) {
        validationErrors.push(`Row ${index + 1}: Invalid SoundCloud URL format`);
      }
      if (member.follower_count < 0) {
        validationErrors.push(`Row ${index + 1}: Invalid follower count`);
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
        // Prepare member data with calculated values from CSV
        const emails = [member.email_1];
        if (member.email_2) {
          emails.push(member.email_2);
        }

        // Use first name and stage name to create full name
        const fullName = member.first_name ? `${member.first_name} (${member.stage_name})` : member.stage_name;

        const memberData = {
          name: fullName,
          primary_email: member.email_1,
          emails: emails,
          soundcloud_url: member.soundcloud_url,
          soundcloud_followers: member.follower_count,
          monthly_repost_limit: member.monthly_repost_limit,
          computed_monthly_repost_limit: member.monthly_repost_limit,
          size_tier: member.size_tier,
          status: 'active' as const
        };

        // Insert member
        const { data: insertedMember, error: memberError } = await supabase
          .from('members')
          .insert(memberData)
          .select('id')
          .single();

        if (memberError) throw memberError;

        // Create repost credit wallet for the member
        const { error: walletError } = await supabase
          .from('repost_credit_wallet')
          .insert({
            member_id: insertedMember.id,
            balance: member.monthly_repost_limit,
            monthly_grant: member.monthly_repost_limit,
            cap: member.monthly_repost_limit
          });

        if (walletError) {
          console.warn('Failed to create wallet for member:', walletError);
          // Don't fail the import if wallet creation fails
        }

        importResults.push({
          member,
          success: true
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
    const template = `stage name,first name,email 1,email 2,soundcloud url,follower count
DJ Example,John,dj@example.com,john@backup.com,https://soundcloud.com/dj-example,150000
Producer Name,,producer@example.com,,https://soundcloud.com/producer-name,50000
Artist Stage,Jane,artist@example.com,jane@personal.com,https://soundcloud.com/artist-stage,1200000`;
    
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
                placeholder="stage name,first name,email 1,email 2,soundcloud url,follower count&#10;DJ Example,John,dj@example.com,john@backup.com,https://soundcloud.com/dj-example,150000"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Required: Stage Name, Email 1, SoundCloud URL, Follower Count. Optional: First Name, Email 2. Tier and limits auto-calculated from follower count.
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
                      <p className="font-medium">{member.stage_name} {member.first_name && `(${member.first_name})`}</p>
                      <p className="text-sm text-muted-foreground">{member.email_1}</p>
                      <p className="text-xs text-muted-foreground">{member.soundcloud_url}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.follower_count.toLocaleString()} followers → {member.size_tier} → {member.monthly_repost_limit} reposts/month
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {validateEmail(member.email_1) && validateUrl(member.soundcloud_url) && member.follower_count >= 0 ? (
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
                Creating member accounts with auto-calculated tiers and limits...
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
                      <p className="font-medium">{result.member.stage_name} {result.member.first_name && `(${result.member.first_name})`}</p>
                      <p className="text-sm text-muted-foreground">{result.member.email_1}</p>
                      {result.success && (
                        <p className="text-xs text-green-600">
                          Imported as {result.member.size_tier} with {result.member.monthly_repost_limit} monthly reposts
                        </p>
                      )}
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