import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateReceiptLinkData, CampaignReceiptLink } from '@/hooks/useCampaignReceiptLinks';

interface AddReceiptLinkFormProps {
  campaignId: string;
  initialData?: CampaignReceiptLink;
  onSuccess?: () => void;
  onSubmit: (data: CreateReceiptLinkData | Partial<CampaignReceiptLink>) => Promise<any>;
}

export const AddReceiptLinkForm = ({ 
  campaignId, 
  initialData, 
  onSuccess, 
  onSubmit 
}: AddReceiptLinkFormProps) => {
  const [formData, setFormData] = useState({
    supporter_name: initialData?.supporter_name || '',
    supporter_handle: initialData?.supporter_handle || '',
    reach_amount: initialData?.reach_amount || 0,
    proof_url: initialData?.proof_url || '',
    scheduled_date: initialData?.scheduled_date || '',
    status: initialData?.status || 'scheduled'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supporter_name || !formData.supporter_handle || formData.reach_amount <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: CreateReceiptLinkData | Partial<CampaignReceiptLink> = {
        ...formData,
        campaign_id: campaignId,
        proof_url: formData.proof_url || null,
        scheduled_date: formData.scheduled_date || null
      };
      
      await onSubmit(submitData);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit receipt link:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supporter_name">Supporter Name</Label>
          <Input
            id="supporter_name"
            placeholder="Enter supporter name"
            value={formData.supporter_name}
            onChange={(e) => handleInputChange('supporter_name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supporter_handle">Handle</Label>
          <Input
            id="supporter_handle"
            placeholder="@username"
            value={formData.supporter_handle}
            onChange={(e) => handleInputChange('supporter_handle', e.target.value.replace('@', ''))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reach_amount">Reach Amount</Label>
          <Input
            id="reach_amount"
            type="number"
            placeholder="0"
            min="0"
            value={formData.reach_amount}
            onChange={(e) => handleInputChange('reach_amount', parseInt(e.target.value) || 0)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleInputChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proof_url">Proof URL (Optional)</Label>
        <Input
          id="proof_url"
          type="url"
          placeholder="https://soundcloud.com/..."
          value={formData.proof_url}
          onChange={(e) => handleInputChange('proof_url', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduled_date">Scheduled Date (Optional)</Label>
        <Input
          id="scheduled_date"
          type="date"
          value={formData.scheduled_date}
          onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Add')} Receipt Link
        </Button>
      </div>
    </form>
  );
};