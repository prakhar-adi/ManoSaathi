import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Play,
  Headphones,
  FileText,
  ExternalLink,
  Clock,
  Star,
  Eye,
  EyeOff,
  Upload,
  Link as LinkIcon
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ResourceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  content_type: 'video' | 'audio' | 'article' | 'link';
  category_id: string;
  language: 'english' | 'hindi' | 'urdu';
  duration_minutes?: number;
  content_url?: string;
  content_text?: string;
  thumbnail_url?: string;
  is_active: boolean;
  created_at: string;
  category: ResourceCategory;
  average_rating?: number;
  total_ratings?: number;
}

const AdminResourceManagement: React.FC = () => {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  // Form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'article' as 'video' | 'audio' | 'article' | 'link',
    category_id: '',
    language: 'english' as 'english' | 'hindi' | 'urdu',
    duration_minutes: '',
    content_url: '',
    content_text: '',
    thumbnail_url: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchQuery, selectedCategory, selectedContentType, selectedLanguage, showInactive]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('resource_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select(`
          *,
          category:resource_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (resourcesError) throw resourcesError;

      // Get ratings for each resource
      const resourcesWithRatings = await Promise.all(
        (resourcesData || []).map(async (resource) => {
          const { data: ratings } = await supabase
            .from('user_resource_interactions')
            .select('rating')
            .eq('resource_id', resource.id)
            .not('rating', 'is', null);

          const totalRatings = ratings?.length || 0;
          const averageRating = totalRatings > 0 
            ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / totalRatings 
            : 0;

          return {
            ...resource,
            average_rating: averageRating,
            total_ratings: totalRatings
          };
        })
      );

      setResources(resourcesWithRatings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category_id === selectedCategory);
    }

    // Content type filter
    if (selectedContentType !== 'all') {
      filtered = filtered.filter(resource => resource.content_type === selectedContentType);
    }

    // Language filter
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(resource => resource.language === selectedLanguage);
    }

    // Active/Inactive filter
    if (!showInactive) {
      filtered = filtered.filter(resource => resource.is_active);
    }

    setFilteredResources(filtered);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'article',
      category_id: '',
      language: 'english',
      duration_minutes: '',
      content_url: '',
      content_text: '',
      thumbnail_url: '',
      is_active: true
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (resource: Resource) => {
    setFormData({
      title: resource.title,
      description: resource.description,
      content_type: resource.content_type,
      category_id: resource.category_id,
      language: resource.language,
      duration_minutes: resource.duration_minutes?.toString() || '',
      content_url: resource.content_url || '',
      content_text: resource.content_text || '',
      thumbnail_url: resource.thumbnail_url || '',
      is_active: resource.is_active
    });
    setEditingResource(resource);
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const resourceData = {
        title: formData.title,
        description: formData.description,
        content_type: formData.content_type,
        category_id: formData.category_id,
        language: formData.language,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        content_url: formData.content_url || null,
        content_text: formData.content_text || null,
        thumbnail_url: formData.thumbnail_url || null,
        is_active: formData.is_active,
        created_by: profile?.user_id
      };

      if (editingResource) {
        // Update existing resource
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingResource.id);

        if (error) throw error;
      } else {
        // Create new resource
        const { error } = await supabase
          .from('resources')
          .insert(resourceData);

        if (error) throw error;
      }

      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingResource(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Failed to save resource. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource. Please try again.');
    }
  };

  const toggleResourceStatus = async (resourceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ is_active: !currentStatus })
        .eq('id', resourceId);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error('Error updating resource status:', error);
      alert('Failed to update resource status. Please try again.');
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'audio': return Headphones;
      case 'article': return FileText;
      case 'link': return ExternalLink;
      default: return FileText;
    }
  };

  const getLanguageDisplay = (language: string) => {
    switch (language) {
      case 'english': return 'English';
      case 'hindi': return 'हिंदी';
      case 'urdu': return 'اردو';
      default: return language;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Resource Management</h2>
          <p className="text-muted-foreground">Manage mental health resources for students</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
              <DialogDescription>
                Create a new mental health resource for students.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Content Type</label>
                  <Select value={formData.content_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, content_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Select value={formData.language} onValueChange={(value: any) => setFormData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">हिंदी</SelectItem>
                      <SelectItem value="urdu">اردو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {(formData.content_type === 'video' || formData.content_type === 'audio' || formData.content_type === 'link') && (
                <div>
                  <label className="text-sm font-medium">Content URL</label>
                  <Input
                    value={formData.content_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                    placeholder="https://..."
                    required
                  />
                </div>
              )}

              {formData.content_type === 'article' && (
                <div>
                  <label className="text-sm font-medium">Article Content</label>
                  <Textarea
                    value={formData.content_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_text: e.target.value }))}
                    rows={10}
                    placeholder="Write your article content here..."
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Thumbnail URL (Optional)</label>
                <Input
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Add Resource'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedContentType} onValueChange={setSelectedContentType}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="link">External Link</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="hindi">हिंदी</SelectItem>
              <SelectItem value="urdu">اردو</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </Button>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const ContentIcon = getContentTypeIcon(resource.content_type);
          
          return (
            <Card key={resource.id} className={`${!resource.is_active ? 'opacity-60' : ''}`}>
              <div className="relative">
                {resource.thumbnail_url && (
                  <div className="h-48 bg-cover bg-center rounded-t-lg" 
                       style={{ backgroundImage: `url(${resource.thumbnail_url})` }}>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleResourceStatus(resource.id, resource.is_active)}
                    className="bg-white/80 hover:bg-white"
                  >
                    {resource.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="bg-white/80 text-black">
                    <ContentIcon className="h-3 w-3 mr-1" />
                    {resource.content_type}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <Badge 
                      variant="outline"
                      style={{ borderColor: resource.category.color, color: resource.category.color }}
                    >
                      {resource.category.name}
                    </Badge>
                    <span>{getLanguageDisplay(resource.language)}</span>
                  </div>
                  
                  {resource.duration_minutes && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(resource.duration_minutes)}
                    </div>
                  )}
                  
                  {resource.average_rating && resource.average_rating > 0 && (
                    <div className="flex items-center text-sm">
                      <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                      <span>{resource.average_rating.toFixed(1)}</span>
                      <span className="text-muted-foreground ml-1">({resource.total_ratings})</span>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(resource)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(resource.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resources found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or add a new resource.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the resource information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Content Type</label>
                <Select value={formData.content_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, content_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Language</label>
                <Select value={formData.language} onValueChange={(value: any) => setFormData(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">हिंदी</SelectItem>
                    <SelectItem value="urdu">اردو</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            {(formData.content_type === 'video' || formData.content_type === 'audio' || formData.content_type === 'link') && (
              <div>
                <label className="text-sm font-medium">Content URL</label>
                <Input
                  value={formData.content_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                  placeholder="https://..."
                  required
                />
              </div>
            )}

            {formData.content_type === 'article' && (
              <div>
                <label className="text-sm font-medium">Article Content</label>
                <Textarea
                  value={formData.content_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_text: e.target.value }))}
                  rows={10}
                  placeholder="Write your article content here..."
                  required
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Thumbnail URL (Optional)</label>
              <Input
                value={formData.thumbnail_url}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Update Resource'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminResourceManagement;
