import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List, Plus, Filter } from 'lucide-react';

export const PlannerPage = () => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planner</h1>
          <p className="text-muted-foreground">
            Revolutionary calendar/list unified view for all campaigns and queue items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Unified timeline showing paid campaigns and free queue items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Calendar component will be implemented here */}
              <div className="h-96 bg-muted/30 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Calendar component coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>List View</CardTitle>
              <CardDescription>
                Sortable and filterable list of all scheduled items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* List component will be implemented here */}
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Summer Vibes Campaign</h3>
                      <p className="text-sm text-muted-foreground">Paid • $2,500 • 50k reach target</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">July 15, 2024</p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Deep House Submission</h3>
                      <p className="text-sm text-muted-foreground">Free Queue • Artist: DJ Luna</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">July 16, 2024</p>
                      <p className="text-sm text-muted-foreground">Scheduled</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Indie Rock Promo</h3>
                      <p className="text-sm text-muted-foreground">Paid • $1,800 • 35k reach target</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">July 18, 2024</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};