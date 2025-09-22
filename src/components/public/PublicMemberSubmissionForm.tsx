import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Music, AlertTriangle } from "lucide-react";
import { format, addDays, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  name: string;
  stage_name: string;
  influence_planner_status: string;
}

export function PublicMemberSubmissionForm() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: "",
    stage_name: "",
    member_id: "",
    secondary_email: "",
    group: "",
    song_name: "",
    date_requested: undefined as Date | undefined,
    release_date: undefined as Date | undefined,
    track_url: "",
  });

  // Secure member search - only shows partial matches, no full member list
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search by stage name, return limited results, no email exposure
      const { data, error } = await supabase
        .from('members')
        .select('id, name, stage_name, influence_planner_status')
        .ilike('stage_name', `%${query}%`)
        .limit(5); // Limit results to prevent data scraping

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleMemberSelect = (member: Member) => {
    // Check if member is disconnected
    if (member.influence_planner_status === 'disconnected') {
      toast({
        title: "Reconnection Required",
        description: (
          <div className="space-y-2">
            <p>You need to reconnect to Influence Planner before submitting.</p>
            <div className="flex flex-col gap-1 text-sm">
              <a 
                href="https://influenceplanner.com/user/invite/artistinfluence" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                👉 Reconnect Now
              </a>
              <p>If you think this is an error, contact: <span className="text-primary">katt@artistinfluence.com</span></p>
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    setSelectedMember(member);
    setFormData(prev => ({
      ...prev,
      member_id: member.id,
      stage_name: member.stage_name || member.name,
      first_name: (member.name || '').split(' ')[0] || '',
    }));
    setSearchQuery(member.stage_name || member.name);
    setSearchResults([]);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!selectedMember) {
      toast({
        title: "Member Required",
        description: "Please search and select your stage name from the list.",
        variant: "destructive",
      });
      return false;
    }

    // Check if selected member is disconnected
    if (selectedMember.influence_planner_status === 'disconnected') {
      toast({
        title: "Reconnection Required",
        description: "Please reconnect to Influence Planner before submitting.",
        variant: "destructive",
      });
      return false;
    }

    // Check minimum 2 week notice
    if (formData.date_requested && !isAfter(formData.date_requested, addDays(new Date(), 13))) {
      toast({
        title: "Date Error",
        description: "Please submit your music 2-3 weeks prior to your desired support date (minimum 2 weeks).",
        variant: "destructive",
      });
      return false;
    }

    // Basic URL validation for SoundCloud
    if (formData.track_url && !formData.track_url.includes('soundcloud.com')) {
      toast({
        title: "URL Error", 
        description: "Please provide a SoundCloud URL for your track.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submissionData = {
        member_id: formData.member_id,
        track_url: formData.track_url,
        artist_name: formData.stage_name,
        track_name: formData.song_name,
        support_date: formData.date_requested?.toISOString().split('T')[0] || null,
        release_date: formData.release_date?.toISOString().split('T')[0] || null,
        secondary_email: formData.secondary_email || null,
        family: formData.group || null,
        status: 'new' as const,
      };

      const { error } = await supabase
        .from('submissions')
        .insert([submissionData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Track submission submitted successfully! You will receive a confirmation email shortly.",
      });

      // Reset form
      setFormData({
        first_name: "",
        stage_name: "",
        member_id: "",
        secondary_email: "",
        group: "",
        song_name: "",
        date_requested: undefined,
        release_date: undefined,
        track_url: "",
      });
      setSelectedMember(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit track",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Artist Influence</h1>
          </div>
          <h2 className="text-xl text-muted-foreground">Member Track Submission</h2>
        </div>

        {/* Guidelines */}
        <div className="bg-card border border-border p-6 rounded-lg mb-8 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-foreground mb-2">Not Supported:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Mixes longer than 30 minutes</li>
                <li>Sample pack previews (a full demo track is required for it to be considered a song)</li>
                <li>Podcasts</li>
                <li>Playlists with two or more songs (unless it's an EP)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Additional Guidelines:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Only original music or remixes from member projects are permitted.</li>
              <li>Back-catalog submissions are not accepted.</li>
              <li>Please submit your music 2–3 weeks prior to your desired support date. Support is offered on a first-come, first-served basis.</li>
              <li>If you do not submit a minimum of 2 weeks prior, support can be anticipated two weeks from submission date.</li>
              <li>For artists under the same management or label, there must be at least a 5-day interval between supports for the same member.</li>
              <li>Non-compliance with these guidelines may result in penalties or removal from the group.</li>
            </ul>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground mb-1">Support Follow-Up:</p>
            <p className="text-sm text-muted-foreground">
              If you do not receive support within 5-7 BUSINESS DAYS of your confirmed support date, please contact: 
              <span className="font-medium text-primary"> katt@artistinfluence.com</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              Thank you for being a part of this empowering community!
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="stage_name">Stage Name</Label>
                  <div className="relative">
                    <Input
                      id="stage_name"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Type to search your stage name..."
                      required
                    />
                    {searching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
                        {searchResults.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            className="w-full text-left p-3 hover:bg-accent/10 first:rounded-t-md last:rounded-b-md transition-colors"
                            onClick={() => handleMemberSelect(member)}
                          >
                            <div className="font-medium text-popover-foreground">{member.stage_name || member.name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* No results */}
                    {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                      <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3">
                        <div className="text-sm text-muted-foreground">No members found. Please check your stage name.</div>
                      </div>
                    )}
                  </div>
                  {selectedMember && (
                    <p className="text-xs text-success mt-1">✓ Selected: {selectedMember.stage_name || selectedMember.name}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="secondary_email">Secondary Email (Optional)</Label>
                <Input
                  id="secondary_email"
                  type="email" 
                  value={formData.secondary_email}
                  onChange={(e) => handleInputChange("secondary_email", e.target.value)}
                  placeholder="Optional additional email for notifications"
                />
              </div>
            </div>

            {/* Track Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Track Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="group">Group (Genre)</Label>
                  <Select value={formData.group} onValueChange={(value) => handleInputChange("group", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="techno">Techno</SelectItem>
                      <SelectItem value="dubstep">Dubstep</SelectItem>
                      <SelectItem value="trance">Trance</SelectItem>
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="song_name">Song Name</Label>
                  <Input
                    id="song_name"
                    value={formData.song_name}
                    onChange={(e) => handleInputChange("song_name", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="track_url">URL (SoundCloud)</Label>
                <Input
                  id="track_url"
                  type="url"
                  value={formData.track_url}
                  onChange={(e) => handleInputChange("track_url", e.target.value)}
                  placeholder="https://soundcloud.com/artist/track"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Dates</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date Requested (for support)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date_requested && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date_requested ? format(formData.date_requested, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date_requested}
                        onSelect={(date) => handleInputChange("date_requested", date)}
                        initialFocus
                        disabled={(date) => isAfter(new Date(), addDays(date, -14))}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">Minimum 2 weeks from today</p>
                </div>

                <div>
                  <Label>Release Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.release_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.release_date ? format(formData.release_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.release_date}
                        onSelect={(date) => handleInputChange("release_date", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6 border-t border-border">
              <Button type="submit" disabled={loading} size="lg" className="min-w-48">
                {loading ? "Submitting..." : "Submit Track"}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Need help? Contact us at <span className="text-primary font-medium">katt@artistinfluence.com</span></p>
        </div>
      </div>
    </div>
  );
}