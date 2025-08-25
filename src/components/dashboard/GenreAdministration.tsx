import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Music,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  GitBranch,
  Settings,
  Network,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Palette,
  Zap,
  Link
} from 'lucide-react';

interface GenreFamily {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Subgenre {
  id: string;
  name: string;
  family_id: string;
  patterns: string[];
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  family?: GenreFamily;
}

interface AdjacencyMatrix {
  [key: string]: {
    [key: string]: number;
  };
}

const genreFamilySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  active: z.boolean(),
});

const subgenreSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  family_id: z.string().min(1, 'Family is required'),
  patterns: z.string(),
  order_index: z.number().min(0),
  active: z.boolean(),
});

type GenreFamilyFormData = z.infer<typeof genreFamilySchema>;
type SubgenreFormData = z.infer<typeof subgenreSchema>;

export const GenreAdministration = () => {
  const { toast } = useToast();
  const [families, setFamilies] = useState<GenreFamily[]>([]);
  const [subgenres, setSubgenres] = useState<Subgenre[]>([]);
  const [adjacencyMatrix, setAdjacencyMatrix] = useState<AdjacencyMatrix>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'families' | 'subgenres' | 'matrix'>('families');
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  
  // Modals
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [subgenreModalOpen, setSubgenreModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<GenreFamily | null>(null);
  const [editingSubgenre, setEditingSubgenre] = useState<Subgenre | null>(null);

  const familyForm = useForm<GenreFamilyFormData>({
    resolver: zodResolver(genreFamilySchema),
    defaultValues: {
      name: '',
      active: true,
    },
  });

  const subgenreForm = useForm<SubgenreFormData>({
    resolver: zodResolver(subgenreSchema),
    defaultValues: {
      name: '',
      family_id: '',
      patterns: '',
      order_index: 0,
      active: true,
    },
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [familiesResult, subgenresResult, settingsResult] = await Promise.all([
        supabase.from('genre_families').select('*').order('name'),
        supabase.from('subgenres').select('*, genre_families(*)').order('family_id, order_index'),
        supabase.from('settings').select('adjacency_matrix').single()
      ]);

      if (familiesResult.error) throw familiesResult.error;
      if (subgenresResult.error) throw subgenresResult.error;

      setFamilies(familiesResult.data || []);
      setSubgenres(subgenresResult.data?.map(sg => ({
        ...sg,
        family: sg.genre_families
      })) || []);
      setAdjacencyMatrix((settingsResult.data?.adjacency_matrix as AdjacencyMatrix) || {});
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch genre data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (data: GenreFamilyFormData) => {
    try {
      const { error } = await supabase
        .from('genre_families')
        .insert([{
          name: data.name,
          active: data.active
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Genre family created successfully",
      });

      familyForm.reset();
      setFamilyModalOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create genre family",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFamily = async (data: GenreFamilyFormData) => {
    if (!editingFamily) return;

    try {
      const { error } = await supabase
        .from('genre_families')
        .update(data)
        .eq('id', editingFamily.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Genre family updated successfully",
      });

      familyForm.reset();
      setFamilyModalOpen(false);
      setEditingFamily(null);
      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update genre family",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFamily = async (family: GenreFamily) => {
    if (!confirm(`Are you sure you want to delete "${family.name}"? This will also delete all associated subgenres.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('genre_families')
        .delete()
        .eq('id', family.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Genre family deleted successfully",
      });

      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete genre family",
        variant: "destructive",
      });
    }
  };

  const handleCreateSubgenre = async (data: SubgenreFormData) => {
    try {
      const patterns = data.patterns.split(',').map(p => p.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('subgenres')
        .insert([{
          name: data.name,
          family_id: data.family_id,
          patterns,
          order_index: data.order_index,
          active: data.active
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subgenre created successfully",
      });

      subgenreForm.reset();
      setSubgenreModalOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subgenre",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSubgenre = async (data: SubgenreFormData) => {
    if (!editingSubgenre) return;

    try {
      const patterns = data.patterns.split(',').map(p => p.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('subgenres')
        .update({
          name: data.name,
          family_id: data.family_id,
          patterns,
          order_index: data.order_index,
          active: data.active
        })
        .eq('id', editingSubgenre.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subgenre updated successfully",
      });

      subgenreForm.reset();
      setSubgenreModalOpen(false);
      setEditingSubgenre(null);
      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update subgenre",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubgenre = async (subgenre: Subgenre) => {
    if (!confirm(`Are you sure you want to delete "${subgenre.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subgenres')
        .delete()
        .eq('id', subgenre.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subgenre deleted successfully",
      });

      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subgenre",
        variant: "destructive",
      });
    }
  };

  const updateAdjacencyMatrix = async (newMatrix: AdjacencyMatrix) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          adjacency_matrix: newMatrix,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setAdjacencyMatrix(newMatrix);
      toast({
        title: "Success",
        description: "Adjacency matrix updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update adjacency matrix",
        variant: "destructive",
      });
    }
  };

  const toggleFamilyExpansion = (familyId: string) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(familyId)) {
      newExpanded.delete(familyId);
    } else {
      newExpanded.add(familyId);
    }
    setExpandedFamilies(newExpanded);
  };

  const openFamilyModal = (family?: GenreFamily) => {
    if (family) {
      setEditingFamily(family);
      familyForm.reset({
        name: family.name,
        active: family.active,
      });
    } else {
      setEditingFamily(null);
      familyForm.reset();
    }
    setFamilyModalOpen(true);
  };

  const openSubgenreModal = (subgenre?: Subgenre) => {
    if (subgenre) {
      setEditingSubgenre(subgenre);
      subgenreForm.reset({
        name: subgenre.name,
        family_id: subgenre.family_id,
        patterns: subgenre.patterns.join(', '),
        order_index: subgenre.order_index,
        active: subgenre.active,
      });
    } else {
      setEditingSubgenre(null);
      subgenreForm.reset();
    }
    setSubgenreModalOpen(true);
  };

  const filteredFamilies = families.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubgenres = subgenres.filter(subgenre =>
    subgenre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subgenre.family?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading genre data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Music className="w-8 h-8" />
            Genre Administration
          </h1>
          <p className="text-muted-foreground">
            Manage genre families, subgenres, and compatibility matrix
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {families.length} families, {subgenres.length} subgenres
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={activeTab === 'families' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('families')}
          className="flex items-center gap-2"
        >
          <Palette className="w-4 h-4" />
          Genre Families
        </Button>
        <Button
          variant={activeTab === 'subgenres' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('subgenres')}
          className="flex items-center gap-2"
        >
          <GitBranch className="w-4 h-4" />
          Subgenres
        </Button>
        <Button
          variant={activeTab === 'matrix' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('matrix')}
          className="flex items-center gap-2"
        >
          <Network className="w-4 h-4" />
          Compatibility Matrix
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Genre Families Tab */}
      {activeTab === 'families' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Genre Families
                </CardTitle>
                <CardDescription>
                  Manage high-level genre categories that group related subgenres
                </CardDescription>
              </div>
              <Button onClick={() => openFamilyModal()} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Family
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFamilies.map(family => {
                  const familySubgenres = subgenres.filter(sg => sg.family_id === family.id);
                  const isExpanded = expandedFamilies.has(family.id);
                  
                  return (
                    <div key={family.id} className="border border-border rounded-lg">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFamilyExpansion(family.id)}
                            className="p-1 hover:bg-accent"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </Button>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{family.name}</h3>
                              <Badge variant={family.active ? "default" : "secondary"}>
                                {family.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {familySubgenres.length} subgenre{familySubgenres.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openFamilyModal(family)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFamily(family)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {isExpanded && familySubgenres.length > 0 && (
                        <div className="border-t border-border p-4 bg-muted/20">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {familySubgenres.map(subgenre => (
                              <div key={subgenre.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{subgenre.name}</span>
                                  <Badge variant={subgenre.active ? "outline" : "secondary"} className="text-xs">
                                    {subgenre.active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openSubgenreModal(subgenre)}
                                  className="p-1"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredFamilies.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No genre families found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subgenres Tab */}
      {activeTab === 'subgenres' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Subgenres
                </CardTitle>
                <CardDescription>
                  Manage detailed genre classifications with Spotify matching patterns
                </CardDescription>
              </div>
              <Button onClick={() => openSubgenreModal()} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Subgenre
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Family</TableHead>
                      <TableHead>Spotify Patterns</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubgenres.map(subgenre => (
                      <TableRow key={subgenre.id}>
                        <TableCell className="font-medium">{subgenre.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{subgenre.family?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {subgenre.patterns.slice(0, 3).map((pattern, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {pattern}
                              </Badge>
                            ))}
                            {subgenre.patterns.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{subgenre.patterns.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{subgenre.order_index}</TableCell>
                        <TableCell>
                          <Badge variant={subgenre.active ? "default" : "secondary"}>
                            {subgenre.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSubgenreModal(subgenre)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubgenre(subgenre)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredSubgenres.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No subgenres found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compatibility Matrix Tab */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Genre Compatibility Matrix
              </CardTitle>
              <CardDescription>
                Define compatibility scores between genre families for queue generation (0.0 = incompatible, 1.0 = perfect match)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Matrix entries: {Object.keys(adjacencyMatrix).length} families configured
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newMatrix: AdjacencyMatrix = {};
                      families.forEach(family1 => {
                        newMatrix[family1.name] = {};
                        families.forEach(family2 => {
                          if (family1.id === family2.id) {
                            newMatrix[family1.name][family2.name] = 1.0;
                          } else {
                            newMatrix[family1.name][family2.name] = adjacencyMatrix[family1.name]?.[family2.name] || 0.5;
                          }
                        });
                      });
                      updateAdjacencyMatrix(newMatrix);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Initialize Matrix
                  </Button>
                </div>
                
                {families.length > 0 && (
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr>
                            <th className="border border-border p-2 bg-muted text-left text-sm font-medium">
                              Family
                            </th>
                            {families.map(family => (
                              <th key={family.id} className="border border-border p-2 bg-muted text-center text-sm font-medium min-w-24">
                                <div className="truncate" title={family.name}>
                                  {family.name}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {families.map(family1 => (
                            <tr key={family1.id}>
                              <td className="border border-border p-2 bg-muted text-sm font-medium">
                                {family1.name}
                              </td>
                              {families.map(family2 => {
                                const value = adjacencyMatrix[family1.name]?.[family2.name] || 0.5;
                                const isIdentical = family1.id === family2.id;
                                
                                return (
                                  <td key={family2.id} className="border border-border p-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="1"
                                      step="0.1"
                                      value={value}
                                      disabled={isIdentical}
                                      onChange={(e) => {
                                        const newValue = parseFloat(e.target.value) || 0;
                                        const newMatrix = { ...adjacencyMatrix };
                                        if (!newMatrix[family1.name]) {
                                          newMatrix[family1.name] = {};
                                        }
                                        newMatrix[family1.name][family2.name] = newValue;
                                        
                                        // Make it symmetric
                                        if (!newMatrix[family2.name]) {
                                          newMatrix[family2.name] = {};
                                        }
                                        newMatrix[family2.name][family1.name] = newValue;
                                        
                                        setAdjacencyMatrix(newMatrix);
                                      }}
                                      className={`w-16 h-8 text-xs text-center ${
                                        isIdentical ? 'bg-muted' : ''
                                      } ${
                                        value < 0.3 ? 'border-destructive' : 
                                        value > 0.7 ? 'border-green-500' : 
                                        'border-orange-500'
                                      }`}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-destructive rounded"></div>
                      Low (&lt; 0.3)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-orange-500 rounded"></div>
                      Medium (0.3-0.7)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-green-500 rounded"></div>
                      High (&gt; 0.7)
                    </div>
                  </div>
                  <Button
                    onClick={() => updateAdjacencyMatrix(adjacencyMatrix)}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Matrix
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Genre Family Modal */}
      <Dialog open={familyModalOpen} onOpenChange={setFamilyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFamily ? 'Edit Genre Family' : 'Create Genre Family'}
            </DialogTitle>
            <DialogDescription>
              {editingFamily 
                ? 'Update the genre family details' 
                : 'Create a new high-level genre category'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...familyForm}>
            <form onSubmit={familyForm.handleSubmit(editingFamily ? handleUpdateFamily : handleCreateFamily)} className="space-y-4">
              <FormField
                control={familyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Family Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Electronic, Hip-Hop, Rock" {...field} />
                    </FormControl>
                    <FormDescription>
                      A broad genre category that groups related subgenres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={familyForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Active families are used in genre classification
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
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFamilyModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFamily ? 'Update' : 'Create'} Family
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Subgenre Modal */}
      <Dialog open={subgenreModalOpen} onOpenChange={setSubgenreModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSubgenre ? 'Edit Subgenre' : 'Create Subgenre'}
            </DialogTitle>
            <DialogDescription>
              {editingSubgenre 
                ? 'Update the subgenre details and Spotify matching patterns' 
                : 'Create a new subgenre with specific classification patterns'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...subgenreForm}>
            <form onSubmit={subgenreForm.handleSubmit(editingSubgenre ? handleUpdateSubgenre : handleCreateSubgenre)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={subgenreForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subgenre Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Deep House, Trap, Alternative Rock" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={subgenreForm.control}
                  name="family_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre Family</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select family" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {families.map(family => (
                            <SelectItem key={family.id} value={family.id}>
                              {family.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={subgenreForm.control}
                name="patterns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spotify Classification Patterns</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="deep house, tech house, minimal techno, progressive house"
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of Spotify genre keywords for automatic classification. These patterns will be matched against artist Spotify genres.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={subgenreForm.control}
                  name="order_index"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Index</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Sort order within the family (lower numbers first)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={subgenreForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Used in classification
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
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSubgenreModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSubgenre ? 'Update' : 'Create'} Subgenre
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};