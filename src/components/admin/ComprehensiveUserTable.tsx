import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, RefreshCw, FileText, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ComprehensiveUserData {
  code: string;
  name: string;
  phone: string;
  email: string;
  student_number: string;
  project_title: string;
  supervisor: string;
  department: string;
  trl: number;
  budget_cost: number;
  award_category: string;
  impact_level: string;
  idf_document: boolean;
  innovation_hub_application: boolean;
  mou_moa_document: boolean;
  patent_application: boolean;
  project_documentation: number;
  user_id: string;
  project_id: string;
  project_status: string;
}

const ComprehensiveUserTable: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<ComprehensiveUserData[]>([]);
  const [filteredData, setFilteredData] = useState<ComprehensiveUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterImpactLevel, setFilterImpactLevel] = useState('all');
  const [selectedProject, setSelectedProject] = useState<{ id: string; title: string; impact_level: string } | null>(null);
  const [isImpactDialogOpen, setIsImpactDialogOpen] = useState(false);
  const [newImpactLevel, setNewImpactLevel] = useState('');
  const [editingRecord, setEditingRecord] = useState<ComprehensiveUserData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchComprehensiveData();
  }, []);

  useEffect(() => {
    filterTableData();
  }, [data, searchQuery, filterDepartment, filterStatus, filterImpactLevel]);

  const fetchComprehensiveData = async () => {
    setIsLoading(true);
    try {
      // Fetch comprehensive data by joining multiple tables
      const { data: usersWithProjects, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          code,
          full_name,
          phone,
          email,
          student_number,
          projects (
            id,
            title,
            supervisor,
            department,
            current_trl_level,
            budget_cost,
            award_category,
            impact_level,
            status,
            idf_document_url,
            mou_moa_document_url,
            patent_application_url
          )
        `);

      if (error) throw error;

      // Fetch project documents count for each project
      const projectIds = usersWithProjects
        ?.flatMap(user => user.projects?.map(p => p.id) || [])
        .filter(Boolean) || [];

      const { data: documentsCount, error: docsError } = await supabase
        .from('project_documents')
        .select('project_id')
        .in('project_id', projectIds);

      if (docsError) throw docsError;

      // Fetch innovation hub applications
      const { data: hubApplications, error: hubError } = await supabase
        .from('innovation_hub_applications')
        .select('user_id, status');

      if (hubError) throw hubError;

      // Process and structure the data
      const comprehensiveData: ComprehensiveUserData[] = [];

      usersWithProjects?.forEach(user => {
        if (user.projects && user.projects.length > 0) {
          user.projects.forEach(project => {
            const docsCount = documentsCount?.filter(doc => doc.project_id === project.id).length || 0;
            const hubApp = hubApplications?.find(app => app.user_id === user.id);

            comprehensiveData.push({
              code: user.code || 'N/A',
              name: user.full_name || 'N/A',
              phone: user.phone || 'N/A',
              email: user.email,
              student_number: user.student_number || 'N/A',
              project_title: project.title,
              supervisor: project.supervisor || 'N/A',
              department: project.department || 'N/A',
              trl: project.current_trl_level,
              budget_cost: project.budget_cost || 0,
              award_category: project.award_category || 'N/A',
              impact_level: project.impact_level,
              idf_document: !!project.idf_document_url,
              innovation_hub_application: !!hubApp,
              mou_moa_document: !!project.mou_moa_document_url,
              patent_application: !!project.patent_application_url,
              project_documentation: docsCount,
              user_id: user.id,
              project_id: project.id,
              project_status: project.status
            });
          });
        } else {
          // Users without projects
          const hubApp = hubApplications?.find(app => app.user_id === user.id);
          
          comprehensiveData.push({
            code: user.code || 'N/A',
            name: user.full_name || 'N/A',
            phone: user.phone || 'N/A',
            email: user.email,
            student_number: user.student_number || 'N/A',
            project_title: 'No Project',
            supervisor: 'N/A',
            department: 'N/A',
            trl: 0,
            budget_cost: 0,
            award_category: 'N/A',
            impact_level: 'low',
            idf_document: false,
            innovation_hub_application: !!hubApp,
            mou_moa_document: false,
            patent_application: false,
            project_documentation: 0,
            user_id: user.id,
            project_id: '',
            project_status: 'no-project'
          });
        }
      });

      setData(comprehensiveData);
    } catch (error) {
      console.error('Error fetching comprehensive data:', error);
      toast({
        title: "Error",
        description: "Failed to load comprehensive user data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTableData = () => {
    let filtered = data;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(item => item.department === filterDepartment);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.project_status === filterStatus);
    }

    // Impact level filter
    if (filterImpactLevel !== 'all') {
      filtered = filtered.filter(item => item.impact_level === filterImpactLevel);
    }

    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Code', 'Name', 'Phone No.', 'Email Address', 'Student Number',
      'Project Title', 'Supervisor', 'Department', 'TRL', 'Budget/Cost ($)',
      'Award Category', 'Impact Level', 'IDF Document', 'Innovation Hub Application',
      'MOU/MOA Document', 'Patent Application', 'Project Documentation Count'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.code,
        `"${row.name}"`,
        row.phone,
        row.email,
        row.student_number,
        `"${row.project_title}"`,
        `"${row.supervisor}"`,
        `"${row.department}"`,
        row.trl,
        row.budget_cost,
        `"${row.award_category}"`,
        row.impact_level,
        row.idf_document ? 'Yes' : 'No',
        row.innovation_hub_application ? 'Yes' : 'No',
        row.mou_moa_document ? 'Yes' : 'No',
        row.patent_application ? 'Yes' : 'No',
        row.project_documentation
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comprehensive_user_data_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Comprehensive user data exported to CSV file",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    doc.setFontSize(18);
    doc.text('Comprehensive User & Project Data Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
    doc.text(`Total Records: ${filteredData.length}`, 14, 36);

    const headers = [
      'Code', 'Name', 'Phone', 'Email', 'Student#',
      'Project Title', 'Supervisor', 'Dept', 'TRL', 'Budget',
      'Award', 'Impact', 'IDF', 'Hub', 'MOU', 'Patent', 'Docs'
    ];

    const rows = filteredData.map(row => [
      row.code,
      row.name,
      row.phone,
      row.email,
      row.student_number,
      row.project_title,
      row.supervisor,
      row.department,
      row.trl.toString(),
      row.budget_cost > 0 ? `$${row.budget_cost.toLocaleString()}` : 'N/A',
      row.award_category,
      row.impact_level,
      row.idf_document ? 'Yes' : 'No',
      row.innovation_hub_application ? 'Yes' : 'No',
      row.mou_moa_document ? 'Yes' : 'No',
      row.patent_application ? 'Yes' : 'No',
      row.project_documentation.toString()
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 45,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 15 }, // Code
        1: { cellWidth: 20 }, // Name
        2: { cellWidth: 18 }, // Phone
        3: { cellWidth: 25 }, // Email
        4: { cellWidth: 15 }, // Student#
        5: { cellWidth: 25 }, // Project Title
        6: { cellWidth: 20 }, // Supervisor
        7: { cellWidth: 15 }, // Dept
        8: { cellWidth: 8 },  // TRL
        9: { cellWidth: 15 }, // Budget
        10: { cellWidth: 15 }, // Award
        11: { cellWidth: 12 }, // Impact
        12: { cellWidth: 8 },  // IDF
        13: { cellWidth: 8 },  // Hub
        14: { cellWidth: 8 },  // MOU
        15: { cellWidth: 8 },  // Patent
        16: { cellWidth: 8 }   // Docs
      },
      margin: { left: 14, right: 14 }
    });

    doc.save(`comprehensive_user_data_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    toast({
      title: "Export Successful",
      description: "Comprehensive user data exported to PDF file",
    });
  };

  const handleImpactLevelEdit = (projectId: string, projectTitle: string, currentImpactLevel: string) => {
    setSelectedProject({ id: projectId, title: projectTitle, impact_level: currentImpactLevel });
    setNewImpactLevel(currentImpactLevel);
    setIsImpactDialogOpen(true);
  };

  const updateImpactLevel = async () => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ impact_level: newImpactLevel })
        .eq('id', selectedProject.id);

      if (error) throw error;

      toast({
        title: "Impact Level Updated",
        description: `Project "${selectedProject.title}" impact level updated to ${newImpactLevel}`,
      });

      setIsImpactDialogOpen(false);
      setSelectedProject(null);
      fetchComprehensiveData(); // Refresh data
    } catch (error) {
      console.error('Error updating impact level:', error);
      toast({
        title: "Error",
        description: "Failed to update impact level",
        variant: "destructive",
      });
    }
  };

  const handleEditRecord = (record: ComprehensiveUserData) => {
    setEditingRecord({ ...record });
    setIsEditDialogOpen(true);
  };

  const updateRecord = async () => {
    if (!editingRecord) return;

    try {
      // Update user profile
      const { error: userError } = await supabase
        .from('user_profiles')
        .update({
          full_name: editingRecord.name,
          phone: editingRecord.phone,
          student_number: editingRecord.student_number
        })
        .eq('id', editingRecord.user_id);

      if (userError) throw userError;

      // Update project if it exists
      if (editingRecord.project_id) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            title: editingRecord.project_title,
            supervisor: editingRecord.supervisor,
            department: editingRecord.department,
            budget_cost: editingRecord.budget_cost,
            award_category: editingRecord.award_category,
            impact_level: editingRecord.impact_level
          })
          .eq('id', editingRecord.project_id);

        if (projectError) throw projectError;
      }

      toast({
        title: "Record Updated",
        description: "User and project information updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingRecord(null);
      fetchComprehensiveData(); // Refresh data
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const getImpactBadgeVariant = (level: string) => {
    switch (level) {
      case 'very high': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on-hold': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const uniqueDepartments = [...new Set(data.map(item => item.department))].filter(dept => dept !== 'N/A');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Comprehensive User Data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Comprehensive User & Project Data ({filteredData.length} records)</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchComprehensiveData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, project, or code..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-project">No Project</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterImpactLevel} onValueChange={setFilterImpactLevel}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Impact Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Impact</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="very high">Very High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Code</TableHead>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="min-w-[120px]">Phone No.</TableHead>
                <TableHead className="min-w-[200px]">Email Address</TableHead>
                <TableHead className="min-w-[120px]">Student Number</TableHead>
                <TableHead className="min-w-[200px]">Project Title</TableHead>
                <TableHead className="min-w-[150px]">Supervisor</TableHead>
                <TableHead className="min-w-[120px]">Department</TableHead>
                <TableHead className="w-[60px]">TRL</TableHead>
                <TableHead className="min-w-[120px]">Budget/Cost ($)</TableHead>
                <TableHead className="min-w-[120px]">Award Category</TableHead>
                <TableHead className="min-w-[100px]">Impact Level</TableHead>
                <TableHead className="min-w-[60px]">IDF</TableHead>
                <TableHead className="min-w-[100px]">Innovation Hub</TableHead>
                <TableHead className="min-w-[80px]">MOU/MOA</TableHead>
                <TableHead className="min-w-[80px]">Patent App</TableHead>
                <TableHead className="min-w-[80px]">Docs</TableHead>
                <TableHead className="min-w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <TableRow key={`${row.user_id}-${row.project_id}-${index}`}>
                    <TableCell className="font-mono font-medium">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.student_number}</TableCell>
                    <TableCell>{row.project_title}</TableCell>
                    <TableCell>{row.supervisor}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell className="text-center">{row.trl}</TableCell>
                    <TableCell className="text-right">
                      {row.budget_cost > 0 ? `$${row.budget_cost.toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell>{row.award_category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getImpactBadgeVariant(row.impact_level)}>
                          {row.impact_level}
                        </Badge>
                        {row.project_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleImpactLevelEdit(row.project_id, row.project_title, row.impact_level)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.idf_document ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.innovation_hub_application ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.mou_moa_document ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.patent_application ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={row.project_documentation > 0 ? "default" : "outline"}>
                        {row.project_documentation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRecord(row)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={18} className="text-center py-8 text-muted-foreground">
                    {searchQuery || filterDepartment !== 'all' || filterStatus !== 'all' || filterImpactLevel !== 'all'
                      ? 'No data matches your search criteria'
                      : 'No user or project data found'
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Impact Level Edit Dialog */}
        <Dialog open={isImpactDialogOpen} onOpenChange={setIsImpactDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Project Impact Level</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Project: {selectedProject?.title}</p>
                <p className="text-sm text-muted-foreground">Current Impact: {selectedProject?.impact_level}</p>
              </div>
              <div>
                <label className="text-sm font-medium">New Impact Level</label>
                <Select value={newImpactLevel} onValueChange={setNewImpactLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="very high">Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImpactDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateImpactLevel}>
                  Update Impact Level
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Record Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Record</DialogTitle>
            </DialogHeader>
            {editingRecord && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={editingRecord.name}
                    onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={editingRecord.phone}
                    onChange={(e) => setEditingRecord({ ...editingRecord, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Student Number</label>
                  <Input
                    value={editingRecord.student_number}
                    onChange={(e) => setEditingRecord({ ...editingRecord, student_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Project Title</label>
                  <Input
                    value={editingRecord.project_title}
                    onChange={(e) => setEditingRecord({ ...editingRecord, project_title: e.target.value })}
                    disabled={!editingRecord.project_id}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Supervisor</label>
                  <Input
                    value={editingRecord.supervisor}
                    onChange={(e) => setEditingRecord({ ...editingRecord, supervisor: e.target.value })}
                    disabled={!editingRecord.project_id}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <Input
                    value={editingRecord.department}
                    onChange={(e) => setEditingRecord({ ...editingRecord, department: e.target.value })}
                    disabled={!editingRecord.project_id}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Budget/Cost ($)</label>
                  <Input
                    type="number"
                    value={editingRecord.budget_cost}
                    onChange={(e) => setEditingRecord({ ...editingRecord, budget_cost: Number(e.target.value) })}
                    disabled={!editingRecord.project_id}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Award Category</label>
                  <Input
                    value={editingRecord.award_category}
                    onChange={(e) => setEditingRecord({ ...editingRecord, award_category: e.target.value })}
                    disabled={!editingRecord.project_id}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Impact Level</label>
                  <Select 
                    value={editingRecord.impact_level} 
                    onValueChange={(value) => setEditingRecord({ ...editingRecord, impact_level: value })}
                    disabled={!editingRecord.project_id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="very high">Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateRecord}>
                Update Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ComprehensiveUserTable;