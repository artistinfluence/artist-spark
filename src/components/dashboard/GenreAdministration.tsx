import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Edit, Music, Network, Shuffle } from "lucide-react";

interface GenreFamily {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

interface Subgenre {
  id: string;
  name: string;
  family_id: string;
  patterns: string[];
  active: boolean;
  order_index: number;
}

interface Settings {
  adjacency_matrix: Record<string, Record<string, number>>;
}

export const GenreAdministration = () => {
  const { toast } = useToast();
  const [genreFamilies, setGenreFamilies] = useState<GenreFamily[]>([]);
  const [subgenres, setSubgenres] = useState<Subgenre[]>([]);
  const [settings, setSettings] = useState<Settings>({ adjacency_matrix: {} });
  const [loading, setLoading] = useState(true);

  // Form states
  const [familyForm, setFamilyForm] = useState({ name: '', active: true });
  const [subgenreForm, setSubgenreForm] = useState({ 
    name: '', 
    family_id: '', 
    patterns: [''], 
    active: true, 
    order_index: 0 
  });
  const [editingFamily, setEditingFamily] = useState<GenreFamily | null>(null);
  const [editingSubgenre, setEditingSubgenre] = useState<Subgenre | null>(null);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [showSubgenreDialog, setShowSubgenreDialog] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load genre families
      const { data: familiesData, error: familiesError } = await supabase
        .from('genre_families')
        .select('*')
        .order('name');

      if (familiesError) throw familiesError;
      setGenreFamilies(familiesData || []);

      // Load subgenres
      const { data: subgenresData, error: subgenresError } = await supabase
        .from('subgenres')
        .select('*')
        .order('family_id, order_index, name');

      if (subgenresError) throw subgenresError;
      setSubgenres(subgenresData || []);

      // Load settings for adjacency matrix
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('adjacency_matrix')
        .limit(1)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
      const adjacencyMatrix = settingsData?.adjacency_matrix 
        ? (typeof settingsData.adjacency_matrix === 'object' && settingsData.adjacency_matrix !== null 
           ? settingsData.adjacency_matrix as Record<string, Record<string, number>>
           : {})
        : {};
      setSettings({ adjacency_matrix: adjacencyMatrix });

    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveFamily = async () => {
    try {
      if (editingFamily) {
        const { error } = await supabase
          .from('genre_families')
          .update({
            name: familyForm.name,
            active: familyForm.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFamily.id);

        if (error) throw error;
        toast({ title: "Genre family updated successfully" });
      } else {
        const { error } = await supabase
          .from('genre_families')
          .insert({
            name: familyForm.name,
            active: familyForm.active
          });

        if (error) throw error;
        toast({ title: "Genre family created successfully" });
      }

      setShowFamilyDialog(false);
      setFamilyForm({ name: '', active: true });
      setEditingFamily(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error saving genre family",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveSubgenre = async () => {
    try {
      const patterns = subgenreForm.patterns.filter(p => p.trim() !== '');
      
      if (editingSubgenre) {
        const { error } = await supabase
          .from('subgenres')
          .update({
            name: subgenreForm.name,
            family_id: subgenreForm.family_id,
            patterns,
            active: subgenreForm.active,
            order_index: subgenreForm.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSubgenre.id);

        if (error) throw error;
        toast({ title: "Subgenre updated successfully" });
      } else {
        const { error } = await supabase
          .from('subgenres')
          .insert({
            name: subgenreForm.name,
            family_id: subgenreForm.family_id,
            patterns,
            active: subgenreForm.active,
            order_index: subgenreForm.order_index
          });

        if (error) throw error;
        toast({ title: "Subgenre created successfully" });
      }

      setShowSubgenreDialog(false);
      setSubgenreForm({ name: '', family_id: '', patterns: [''], active: true, order_index: 0 });
      setEditingSubgenre(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error saving subgenre",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteFamily = async (id: string) => {
    try {
      const { error } = await supabase
        .from('genre_families')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Genre family deleted successfully" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error deleting genre family",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubgenre = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subgenres')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Subgenre deleted successfully" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error deleting subgenre",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateAdjacencyMatrix = async (from: string, to: string, compatibility: number) => {
    try {
      const newMatrix = { ...settings.adjacency_matrix };
      if (!newMatrix[from]) newMatrix[from] = {};
      newMatrix[from][to] = compatibility;

      const { error } = await supabase
        .from('settings')
        .update({ adjacency_matrix: newMatrix })
        .eq('id', (await supabase.from('settings').select('id').limit(1).single()).data?.id);

      if (error) throw error;
      setSettings({ adjacency_matrix: newMatrix });
      toast({ title: "Adjacency matrix updated" });
    } catch (error: any) {
      toast({
        title: "Error updating adjacency matrix",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addPatternField = () => {
    setSubgenreForm(prev => ({
      ...prev,
      patterns: [...prev.patterns, '']
    }));
  };

  const updatePattern = (index: number, value: string) => {
    setSubgenreForm(prev => ({
      ...prev,
      patterns: prev.patterns.map((p, i) => i === index ? value : p)
    }));
  };

  const removePattern = (index: number) => {
    setSubgenreForm(prev => ({
      ...prev,
      patterns: prev.patterns.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Genre Administration</h1>
          <p className="text-muted-foreground">
            Manage genre families, subgenres, and compatibility settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="families" className="space-y-6">
        <TabsList>
          <TabsTrigger value="families" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Genre Families
          </TabsTrigger>
          <TabsTrigger value="subgenres" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Subgenres
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Shuffle className="h-4 w-4" />
            Adjacency Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="families" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Genre Families</CardTitle>
                  <CardDescription>
                    Manage top-level genre categories
                  </CardDescription>
                </div>
                <Dialog open={showFamilyDialog} onOpenChange={setShowFamilyDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setFamilyForm({ name: '', active: true });
                      setEditingFamily(null);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Family
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingFamily ? 'Edit Genre Family' : 'Add Genre Family'}
                      </DialogTitle>
                      <DialogDescription>
                        Create or edit a genre family category
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="family-name">Name</Label>
                        <Input
                          id="family-name"
                          value={familyForm.name}
                          onChange={(e) => setFamilyForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Electronic, Hip Hop, Rock"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={familyForm.active}
                          onCheckedChange={(checked) => setFamilyForm(prev => ({ ...prev, active: checked }))}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowFamilyDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveFamily}>
                        {editingFamily ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subgenres</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {genreFamilies.map((family) => {
                    const familySubgenres = subgenres.filter(s => s.family_id === family.id);
                    return (
                      <TableRow key={family.id}>
                        <TableCell className="font-medium">{family.name}</TableCell>
                        <TableCell>
                          <Badge variant={family.active ? "default" : "secondary"}>
                            {family.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{familySubgenres.length} subgenres</TableCell>
                        <TableCell>{new Date(family.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFamilyForm({
                                  name: family.name,
                                  active: family.active
                                });
                                setEditingFamily(family);
                                setShowFamilyDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFamily(family.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subgenres" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subgenres</CardTitle>
                  <CardDescription>
                    Manage subgenres and their Spotify classification patterns
                  </CardDescription>
                </div>
                <Dialog open={showSubgenreDialog} onOpenChange={setShowSubgenreDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setSubgenreForm({ name: '', family_id: '', patterns: [''], active: true, order_index: 0 });
                      setEditingSubgenre(null);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subgenre
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingSubgenre ? 'Edit Subgenre' : 'Add Subgenre'}
                      </DialogTitle>
                      <DialogDescription>
                        Create or edit a subgenre with Spotify classification patterns
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="subgenre-name">Name</Label>
                        <Input
                          id="subgenre-name"
                          value={subgenreForm.name}
                          onChange={(e) => setSubgenreForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., House, Trap, Techno"
                        />
                      </div>
                      <div>
                        <Label htmlFor="family-select">Genre Family</Label>
                        <Select
                          value={subgenreForm.family_id}
                          onValueChange={(value) => setSubgenreForm(prev => ({ ...prev, family_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a genre family" />
                          </SelectTrigger>
                          <SelectContent>
                            {genreFamilies.filter(f => f.active).map((family) => (
                              <SelectItem key={family.id} value={family.id}>
                                {family.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Spotify Classification Patterns</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Add patterns that match Spotify genre strings (case-insensitive)
                        </p>
                        {subgenreForm.patterns.map((pattern, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <Input
                              value={pattern}
                              onChange={(e) => updatePattern(index, e.target.value)}
                              placeholder="e.g., house, deep house, tech house"
                            />
                            {subgenreForm.patterns.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePattern(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" onClick={addPatternField} className="mt-2">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Pattern
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={subgenreForm.active}
                            onCheckedChange={(checked) => setSubgenreForm(prev => ({ ...prev, active: checked }))}
                          />
                          <Label>Active</Label>
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="order-index">Order Index</Label>
                          <Input
                            id="order-index"
                            type="number"
                            value={subgenreForm.order_index}
                            onChange={(e) => setSubgenreForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                            className="w-20"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSubgenreDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveSubgenre}>
                        {editingSubgenre ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Patterns</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subgenres.map((subgenre) => {
                    const family = genreFamilies.find(f => f.id === subgenre.family_id);
                    return (
                      <TableRow key={subgenre.id}>
                        <TableCell className="font-medium">{subgenre.name}</TableCell>
                        <TableCell>{family?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {subgenre.patterns?.slice(0, 3).map((pattern, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {pattern}
                              </Badge>
                            ))}
                            {subgenre.patterns?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{subgenre.patterns.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={subgenre.active ? "default" : "secondary"}>
                            {subgenre.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{subgenre.order_index}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSubgenreForm({
                                  name: subgenre.name,
                                  family_id: subgenre.family_id,
                                  patterns: subgenre.patterns || [''],
                                  active: subgenre.active,
                                  order_index: subgenre.order_index
                                });
                                setEditingSubgenre(subgenre);
                                setShowSubgenreDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubgenre(subgenre.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Genre Compatibility Matrix</CardTitle>
              <CardDescription>
                Define cross-genre compatibility scores (0.0 - 1.0) for intelligent queue balancing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set compatibility scores between genre families. Higher scores mean tracks from these genres 
                  work well together in the same queue. Use 0.0 for incompatible genres and 1.0 for perfect matches.
                </p>
                
                <div className="grid gap-4">
                  {genreFamilies.filter(f => f.active).map((fromFamily) => (
                    <Card key={fromFamily.id} className="p-4">
                      <h4 className="font-medium mb-3">{fromFamily.name} → Other Genres</h4>
                      <div className="grid gap-2">
                        {genreFamilies.filter(f => f.active && f.id !== fromFamily.id).map((toFamily) => {
                          const currentValue = settings.adjacency_matrix[fromFamily.name]?.[toFamily.name] || 0;
                          return (
                            <div key={toFamily.id} className="flex items-center justify-between">
                              <Label className="flex-1">{toFamily.name}</Label>
                              <Input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={currentValue}
                                onChange={(e) => updateAdjacencyMatrix(
                                  fromFamily.name,
                                  toFamily.name,
                                  parseFloat(e.target.value) || 0
                                )}
                                className="w-20"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};