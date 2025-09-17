import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Download, Save, Eye, Calendar, 
  BarChart3, PieChart, LineChart, Users, DollarSign, Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportField {
  id: string;
  name: string;
  type: 'metric' | 'dimension' | 'date' | 'filter';
  category: string;
  description: string;
}

interface ReportConfig {
  id?: string;
  name: string;
  description: string;
  fields: string[];
  filters: ReportFilter[];
  chartType: 'bar' | 'line' | 'pie' | 'table' | 'card';
  dateRange: string;
  groupBy: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isScheduled: boolean;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly';
  recipients?: string[];
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string | number;
}

interface SavedReport {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastRun: string;
  isScheduled: boolean;
  frequency?: string;
}

const AVAILABLE_FIELDS: ReportField[] = [
  // Metrics
  { id: 'total_revenue', name: 'Total Revenue', type: 'metric', category: 'Financial', description: 'Sum of all revenue' },
  { id: 'campaign_count', name: 'Campaign Count', type: 'metric', category: 'Campaigns', description: 'Number of campaigns' },
  { id: 'member_count', name: 'Member Count', type: 'metric', category: 'Members', description: 'Number of members' },
  { id: 'avg_roi', name: 'Average ROI', type: 'metric', category: 'Performance', description: 'Average return on investment' },
  { id: 'completion_rate', name: 'Completion Rate', type: 'metric', category: 'Performance', description: 'Task completion percentage' },
  
  // Dimensions
  { id: 'campaign_status', name: 'Campaign Status', type: 'dimension', category: 'Campaigns', description: 'Campaign status categories' },
  { id: 'member_tier', name: 'Member Tier', type: 'dimension', category: 'Members', description: 'Member tier levels' },
  { id: 'genre', name: 'Genre', type: 'dimension', category: 'Content', description: 'Music genres' },
  { id: 'client_name', name: 'Client Name', type: 'dimension', category: 'Clients', description: 'Client companies' },
  
  // Dates
  { id: 'created_date', name: 'Created Date', type: 'date', category: 'Time', description: 'Record creation date' },
  { id: 'completed_date', name: 'Completed Date', type: 'date', category: 'Time', description: 'Task completion date' },
];

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'table', label: 'Data Table', icon: Users },
  { value: 'card', label: 'Metric Cards', icon: Target },
];

export const ReportBuilder: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    fields: [],
    filters: [],
    chartType: 'bar',
    dateRange: '30days',
    groupBy: '',
    sortBy: '',
    sortOrder: 'desc',
    isScheduled: false,
    recipients: [],
  });

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    // Mock saved reports
    const mockReports: SavedReport[] = [
      {
        id: '1',
        name: 'Monthly Revenue Report',
        description: 'Comprehensive monthly financial overview',
        createdAt: '2024-06-15',
        lastRun: '2024-07-01',
        isScheduled: true,
        frequency: 'monthly'
      },
      {
        id: '2',
        name: 'Campaign Performance Dashboard',
        description: 'Active campaign metrics and ROI analysis',
        createdAt: '2024-06-20',
        lastRun: '2024-07-02',
        isScheduled: false
      },
      {
        id: '3',
        name: 'Member Engagement Analysis',
        description: 'Member activity and retention insights',
        createdAt: '2024-06-25',
        lastRun: '2024-07-01',
        isScheduled: true,
        frequency: 'weekly'
      },
    ];
    setSavedReports(mockReports);
  };

  const addField = (fieldId: string) => {
    if (!reportConfig.fields.includes(fieldId)) {
      setReportConfig({
        ...reportConfig,
        fields: [...reportConfig.fields, fieldId]
      });
    }
  };

  const removeField = (fieldId: string) => {
    setReportConfig({
      ...reportConfig,
      fields: reportConfig.fields.filter(f => f !== fieldId)
    });
  };

  const addFilter = () => {
    setReportConfig({
      ...reportConfig,
      filters: [...reportConfig.filters, { field: '', operator: 'equals', value: '' }]
    });
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const newFilters = [...reportConfig.filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setReportConfig({ ...reportConfig, filters: newFilters });
  };

  const removeFilter = (index: number) => {
    setReportConfig({
      ...reportConfig,
      filters: reportConfig.filters.filter((_, i) => i !== index)
    });
  };

  const saveReport = async () => {
    if (!reportConfig.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a report name",
        variant: "destructive",
      });
      return;
    }

    if (reportConfig.fields.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please select at least one field for the report",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newReport: SavedReport = {
        id: Date.now().toString(),
        name: reportConfig.name,
        description: reportConfig.description,
        createdAt: new Date().toISOString().split('T')[0],
        lastRun: 'Never',
        isScheduled: reportConfig.isScheduled,
        frequency: reportConfig.scheduleFrequency
      };

      setSavedReports([...savedReports, newReport]);
      
      toast({
        title: "Report Saved",
        description: `Report "${reportConfig.name}" has been saved successfully`,
      });

      // Reset form
      setReportConfig({
        name: '',
        description: '',
        fields: [],
        filters: [],
        chartType: 'bar',
        dateRange: '30days',
        groupBy: '',
        sortBy: '',
        sortOrder: 'desc',
        isScheduled: false,
        recipients: [],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (reportConfig.fields.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one field to generate the report",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Report Generated",
        description: "Your custom report has been generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runSavedReport = async (reportId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update last run date
      setSavedReports(reports => 
        reports.map(report => 
          report.id === reportId 
            ? { ...report, lastRun: new Date().toISOString().split('T')[0] }
            : report
        )
      );

      toast({
        title: "Report Generated",
        description: "Report has been generated and is ready for download",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldsByCategory = (category: string) => {
    return AVAILABLE_FIELDS.filter(field => field.category === category);
  };

  const categories = [...new Set(AVAILABLE_FIELDS.map(field => field.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Report Builder
          </h1>
          <p className="text-muted-foreground">
            Create custom reports and analytics dashboards with drag-and-drop interface
          </p>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                  <CardDescription>Set up basic report information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="report-name">Report Name</Label>
                      <Input
                        id="report-name"
                        placeholder="Enter report name"
                        value={reportConfig.name}
                        onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="chart-type">Chart Type</Label>
                      <Select 
                        value={reportConfig.chartType} 
                        onValueChange={(value: any) => setReportConfig({ ...reportConfig, chartType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHART_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this report shows"
                      value={reportConfig.description}
                      onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date-range">Date Range</Label>
                      <Select 
                        value={reportConfig.dateRange} 
                        onValueChange={(value) => setReportConfig({ ...reportConfig, dateRange: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7days">Last 7 days</SelectItem>
                          <SelectItem value="30days">Last 30 days</SelectItem>
                          <SelectItem value="90days">Last 90 days</SelectItem>
                          <SelectItem value="1year">Last year</SelectItem>
                          <SelectItem value="custom">Custom range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sort-order">Sort Order</Label>
                      <Select 
                        value={reportConfig.sortOrder} 
                        onValueChange={(value: any) => setReportConfig({ ...reportConfig, sortOrder: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Descending</SelectItem>
                          <SelectItem value="asc">Ascending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Selected Fields</CardTitle>
                  <CardDescription>Fields included in your report</CardDescription>
                </CardHeader>
                <CardContent>
                  {reportConfig.fields.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {reportConfig.fields.map(fieldId => {
                        const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
                        return field ? (
                          <Badge key={fieldId} variant="outline" className="flex items-center gap-2">
                            {field.name}
                            <Trash2 
                              className="h-3 w-3 cursor-pointer hover:text-destructive" 
                              onClick={() => removeField(fieldId)}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No fields selected. Choose from available fields on the right.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Filters</CardTitle>
                      <CardDescription>Apply filters to your data</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addFilter}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportConfig.filters.length > 0 ? (
                    <div className="space-y-4">
                      {reportConfig.filters.map((filter, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select 
                            value={filter.field} 
                            onValueChange={(value) => updateFilter(index, { field: value })}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_FIELDS.map(field => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={filter.operator} 
                            onValueChange={(value: any) => updateFilter(index, { operator: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="greater_than">Greater than</SelectItem>
                              <SelectItem value="less_than">Less than</SelectItem>
                              <SelectItem value="between">Between</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Input
                            placeholder="Value"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, { value: e.target.value })}
                            className="flex-1"
                          />
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeFilter(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No filters applied. Click "Add Filter" to filter your data.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scheduling Options</CardTitle>
                  <CardDescription>Automatically generate and send reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="schedule"
                      checked={reportConfig.isScheduled}
                      onCheckedChange={(checked) => 
                        setReportConfig({ ...reportConfig, isScheduled: !!checked })
                      }
                    />
                    <Label htmlFor="schedule">Enable scheduled reports</Label>
                  </div>

                  {reportConfig.isScheduled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                      <div>
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select 
                          value={reportConfig.scheduleFrequency || ''} 
                          onValueChange={(value: any) => setReportConfig({ ...reportConfig, scheduleFrequency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="recipients">Recipients</Label>
                        <Input
                          id="recipients"
                          placeholder="email@example.com, email2@example.com"
                          onChange={(e) => 
                            setReportConfig({ 
                              ...reportConfig, 
                              recipients: e.target.value.split(',').map(email => email.trim())
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button 
                  onClick={generateReport} 
                  disabled={loading || reportConfig.fields.length === 0}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Report
                    </>
                  )}
                </Button>
                <Button 
                  onClick={saveReport} 
                  disabled={loading}
                  variant="outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Report
                </Button>
              </div>
            </div>

            {/* Available Fields */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Available Fields</CardTitle>
                  <CardDescription>Click to add fields to your report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categories.map(category => (
                      <div key={category}>
                        <h4 className="font-medium mb-2">{category}</h4>
                        <div className="space-y-1">
                          {getFieldsByCategory(category).map(field => (
                            <div
                              key={field.id}
                              className={`p-2 text-sm border rounded cursor-pointer hover:bg-accent transition-colors ${
                                reportConfig.fields.includes(field.id) 
                                  ? 'bg-primary/10 border-primary' 
                                  : ''
                              }`}
                              onClick={() => addField(field.id)}
                            >
                              <div className="font-medium">{field.name}</div>
                              <div className="text-muted-foreground text-xs">{field.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Reports</CardTitle>
              <CardDescription>Manage and run your saved report configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedReports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Created: {report.createdAt}</span>
                        <span>Last run: {report.lastRun}</span>
                        {report.isScheduled && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {report.frequency}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => runSavedReport(report.id)}
                        disabled={loading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Run Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};