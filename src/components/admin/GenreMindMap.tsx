import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Download, RefreshCw, Zap } from 'lucide-react';

interface GenreFamily {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface Subgenre {
  id: string;
  name: string;
  family_id: string;
  patterns: string[];
  active: boolean;
}

interface AdjacencyMatrix {
  [key: string]: {
    [key: string]: number;
  };
}

const GenreNodeComponent: React.FC<{ data: any }> = ({ data }) => {
  const isFamily = data.type === 'family';
  
  return (
    <Card className={`min-w-[150px] transition-all duration-200 hover:shadow-lg ${
      isFamily ? 'border-2 border-primary' : 'border border-muted'
    }`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {data.color && (
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
          )}
          <div>
            <div className={`font-medium ${isFamily ? 'text-primary' : 'text-foreground'}`}>
              {data.label}
            </div>
            {data.count && (
              <Badge variant="secondary" className="text-xs mt-1">
                {data.count} {isFamily ? 'subgenres' : 'artists'}
              </Badge>
            )}
          </div>
        </div>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {data.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const nodeTypes = {
  genreNode: GenreNodeComponent,
};

export const GenreMindMap: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [genreFamilies, setGenreFamilies] = useState<GenreFamily[]>([]);
  const [subgenres, setSubgenres] = useState<Subgenre[]>([]);
  const [adjacencyMatrix, setAdjacencyMatrix] = useState<AdjacencyMatrix>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [familiesResponse, subgenresResponse] = await Promise.all([
        supabase.from('genre_families').select('*').order('name'),
        supabase.from('subgenres').select('*').order('order_index')
      ]);

      if (familiesResponse.error) throw familiesResponse.error;
      if (subgenresResponse.error) throw subgenresResponse.error;

      setGenreFamilies(familiesResponse.data || []);
      setSubgenres(subgenresResponse.data || []);
      setAdjacencyMatrix({}); // No adjacency matrix table for now
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch genre data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNodes = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Filter based on search term
    const filteredFamilies = genreFamilies.filter(family =>
      family.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSubgenres = subgenres.filter(subgenre =>
      subgenre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filteredFamilies.some(family => family.id === subgenre.family_id)
    );

    // Add family nodes
    filteredFamilies.forEach((family, index) => {
      const familySubgenres = filteredSubgenres.filter(
        sub => sub.family_id === family.id
      );

      newNodes.push({
        id: family.id,
        type: 'genreNode',
        position: { 
          x: (index % 3) * 300, 
          y: Math.floor(index / 3) * 200 
        },
        data: {
          label: family.name,
          type: 'family',
          color: family.color,
          description: family.description,
          count: familySubgenres.length,
        },
        className: selectedNodes.has(family.id) ? 'ring-2 ring-primary' : '',
      });

      // Add subgenre nodes
      familySubgenres.forEach((subgenre, subIndex) => {
        const angle = (subIndex / familySubgenres.length) * 2 * Math.PI;
        const radius = 120;
        const x = (index % 3) * 300 + Math.cos(angle) * radius;
        const y = Math.floor(index / 3) * 200 + Math.sin(angle) * radius;

        newNodes.push({
          id: subgenre.id,
          type: 'genreNode',
          position: { x, y },
          data: {
            label: subgenre.name,
            type: 'subgenre',
            count: 0, // Could fetch artist count here
          },
          className: selectedNodes.has(subgenre.id) ? 'ring-2 ring-primary' : '',
        });

        // Add edge from family to subgenre
        newEdges.push({
          id: `${family.id}-${subgenre.id}`,
          source: family.id,
          target: subgenre.id,
          type: 'smoothstep',
          style: { stroke: '#64748b', strokeWidth: 2 },
        });
      });
    });

    // Add adjacency matrix edges between families
    Object.entries(adjacencyMatrix).forEach(([familyId1, connections]) => {
      Object.entries(connections).forEach(([familyId2, weight]) => {
        if (
          weight > 0 && 
          familyId1 !== familyId2 &&
          filteredFamilies.some(f => f.id === familyId1) &&
          filteredFamilies.some(f => f.id === familyId2)
        ) {
          newEdges.push({
            id: `adj-${familyId1}-${familyId2}`,
            source: familyId1,
            target: familyId2,
            type: 'straight',
            style: { 
              stroke: '#10b981', 
              strokeWidth: Math.max(1, weight * 3),
              strokeDasharray: '5,5',
            },
            label: `${weight}`,
            labelStyle: { 
              fontSize: '12px', 
              fontWeight: 'bold',
              fill: '#10b981'
            },
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [genreFamilies, subgenres, adjacencyMatrix, searchTerm, selectedNodes]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    generateNodes();
  }, [generateNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const newSelectedNodes = new Set(selectedNodes);
    if (selectedNodes.has(node.id)) {
      newSelectedNodes.delete(node.id);
    } else {
      newSelectedNodes.add(node.id);
    }
    setSelectedNodes(newSelectedNodes);
  }, [selectedNodes]);

  const exportAsImage = () => {
    // This would implement image export functionality
    toast({
      title: "Export",
      description: "Mind map export functionality coming soon!",
    });
  };

  const generateLayout = () => {
    // Implement automatic layout generation
    toast({
      title: "Layout",
      description: "Auto-layout generation coming soon!",
    });
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading mind map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data;
            return data.type === 'family' ? '#3b82f6' : '#64748b';
          }}
        />
        <Panel position="top-left" className="bg-background border rounded-lg p-2">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}  
              className="w-48"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={generateLayout}>
              <Zap className="h-4 w-4 mr-1" />
              Auto Layout
            </Button>
            <Button size="sm" variant="outline" onClick={exportAsImage}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </Panel>
        <Panel position="bottom-left" className="bg-background border rounded-lg p-2">
          <div className="text-xs text-muted-foreground">
            <div>Blue: Genre Families</div>
            <div>Gray: Subgenres</div>
            <div>Green Dashed: Compatibility ({Object.keys(adjacencyMatrix).length} connections)</div>
            <div>Selected: {selectedNodes.size} nodes</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};