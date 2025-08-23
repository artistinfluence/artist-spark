import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings2, Clock, Users, Gauge, Bell } from "lucide-react";

const settingsSchema = z.object({
  slack_enabled: z.boolean(),
  slack_channel: z.string().optional(),
  slack_webhook: z.string().url().optional().or(z.literal("")),
  default_reach_factor: z.number().min(0).max(1),
  preview_cache_days: z.number().min(1).max(365),
  inactivity_days: z.number().min(1).max(365),
  proof_sla_hours: z.number().min(1).max(168),
  decision_sla_hours: z.number().min(1).max(168),
  target_band_mode: z.enum(["balance", "size"]),
  size_tier_t1_min: z.number().min(0),
  size_tier_t1_max: z.number().min(0),
  size_tier_t2_min: z.number().min(0),
  size_tier_t2_max: z.number().min(0),
  size_tier_t3_min: z.number().min(0),
  size_tier_t3_max: z.number().min(0),
  size_tier_t4_min: z.number().min(0),
  size_tier_t4_max: z.number().min(0),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      slack_enabled: false,
      slack_channel: "#soundcloud-groups",
      slack_webhook: "",
      default_reach_factor: 0.06,
      preview_cache_days: 30,
      inactivity_days: 90,
      proof_sla_hours: 24,
      decision_sla_hours: 24,
      target_band_mode: "balance",
      size_tier_t1_min: 0,
      size_tier_t1_max: 1000,
      size_tier_t2_min: 1000,
      size_tier_t2_max: 10000,
      size_tier_t3_min: 10000,
      size_tier_t3_max: 100000,
      size_tier_t4_min: 100000,
      size_tier_t4_max: 999999999,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const sizeTierThresholds = data.size_tier_thresholds as any;
        
        form.reset({
          slack_enabled: data.slack_enabled || false,
          slack_channel: data.slack_channel || "#soundcloud-groups",
          slack_webhook: data.slack_webhook || "",
          default_reach_factor: Number(data.default_reach_factor) || 0.06,
          preview_cache_days: data.preview_cache_days || 30,
          inactivity_days: data.inactivity_days || 90,
          proof_sla_hours: data.proof_sla_hours || 24,
          decision_sla_hours: data.decision_sla_hours || 24,
          target_band_mode: data.target_band_mode || "balance",
          size_tier_t1_min: sizeTierThresholds?.T1?.min || 0,
          size_tier_t1_max: sizeTierThresholds?.T1?.max || 1000,
          size_tier_t2_min: sizeTierThresholds?.T2?.min || 1000,
          size_tier_t2_max: sizeTierThresholds?.T2?.max || 10000,
          size_tier_t3_min: sizeTierThresholds?.T3?.min || 10000,
          size_tier_t3_max: sizeTierThresholds?.T3?.max || 100000,
          size_tier_t4_min: sizeTierThresholds?.T4?.min || 100000,
          size_tier_t4_max: sizeTierThresholds?.T4?.max || 999999999,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    try {
      const sizeTierThresholds = {
        T1: { min: data.size_tier_t1_min, max: data.size_tier_t1_max },
        T2: { min: data.size_tier_t2_min, max: data.size_tier_t2_max },
        T3: { min: data.size_tier_t3_min, max: data.size_tier_t3_max },
        T4: { min: data.size_tier_t4_min, max: data.size_tier_t4_max },
      };

      const settingsData = {
        slack_enabled: data.slack_enabled,
        slack_channel: data.slack_channel,
        slack_webhook: data.slack_webhook || null,
        default_reach_factor: data.default_reach_factor,
        preview_cache_days: data.preview_cache_days,
        inactivity_days: data.inactivity_days,
        proof_sla_hours: data.proof_sla_hours,
        decision_sla_hours: data.decision_sla_hours,
        target_band_mode: data.target_band_mode,
        size_tier_thresholds: sizeTierThresholds,
        updated_at: new Date().toISOString(),
      };

      // Try to update existing settings, if none exist, insert new ones
      const { error: upsertError } = await supabase
        .from("settings")
        .upsert(settingsData, { onConflict: "id" });

      if (upsertError) {
        throw upsertError;
      }

      toast({
        title: "Success",
        description: "Settings updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5" />
        <h1 className="text-2xl font-bold">System Settings</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>
                Configure Slack integration for system notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="slack_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Slack Notifications</FormLabel>
                      <FormDescription>
                        Send system notifications to Slack channels
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="slack_channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slack Channel</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="#soundcloud-groups" />
                      </FormControl>
                      <FormDescription>
                        Default channel for notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slack_webhook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slack Webhook URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://hooks.slack.com/..." type="url" />
                      </FormControl>
                      <FormDescription>
                        Webhook URL for Slack integration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SLA Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <CardTitle>SLA & Timing Settings</CardTitle>
              </div>
              <CardDescription>
                Configure service level agreements and timing thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="proof_sla_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proof Submission SLA (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="168"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Hours allowed for proof submission
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="decision_sla_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decision SLA (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="168"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Hours allowed for decision making
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inactivity_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inactivity Threshold (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Days before marking member inactive
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preview_cache_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview Cache Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Days to cache preview data
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Algorithm Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                <CardTitle>Algorithm Settings</CardTitle>
              </div>
              <CardDescription>
                Configure queue generation and reach calculation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="default_reach_factor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Reach Factor</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Default reach factor for new members (0.060 = 6%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_band_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Band Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target band mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="balance">Balance</SelectItem>
                          <SelectItem value="size">Size</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Strategy for queue generation and member matching
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Size Tier Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <CardTitle>Size Tier Thresholds</CardTitle>
              </div>
              <CardDescription>
                Configure follower count thresholds for member size tiers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {["t1", "t2", "t3", "t4"].map((tier, index) => (
                <div key={tier} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      Tier {tier.toUpperCase()} {index === 0 && "(Nano)"} {index === 1 && "(Micro)"} {index === 2 && "(Mid)"} {index === 3 && "(Macro)"}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`size_tier_${tier}_min` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Followers</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`size_tier_${tier}_max` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Followers</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {index < 3 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};