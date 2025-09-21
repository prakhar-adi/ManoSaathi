import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Briefcase, 
  Users, 
  Heart, 
  DollarSign, 
  Brain, 
  GraduationCap, 
  Flower2,
  Search,
  Filter,
  Star,
  Clock,
  Play,
  Headphones,
  FileText,
  ExternalLink,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  created_at: string;
  category: ResourceCategory;
  user_interaction?: {
    is_bookmarked: boolean;
    rating?: number;
    progress_percentage: number;
  };
  average_rating?: number;
  total_ratings?: number;
}

const ResourceHubDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('all');

  const categoryIcons: { [key: string]: React.ComponentType<any> } = {
    BookOpen,
    Briefcase,
    Users,
    Heart,
    DollarSign,
    Brain,
    GraduationCap,
    Flower2
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchQuery, selectedCategory, selectedContentType, selectedLanguage, selectedTab]);

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

      // Load resources with category info and user interactions
      let resourcesQuery = supabase
        .from('resources')
        .select(`
          *,
          category:resource_categories(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data: resourcesData, error: resourcesError } = await resourcesQuery;

      if (resourcesError) throw resourcesError;

      // Load user interactions for each resource
      const resourcesWithInteractions = await Promise.all(
        (resourcesData || []).map(async (resource) => {
          if (!profile) return resource;

          const { data: interaction } = await supabase
            .from('user_resource_interactions')
            .select('is_bookmarked, rating, progress_percentage')
            .eq('user_id', profile.user_id)
            .eq('resource_id', resource.id)
            .single();

          // Get average rating and total ratings
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
            user_interaction: interaction || { is_bookmarked: false, progress_percentage: 0 },
            average_rating: averageRating,
            total_ratings: totalRatings
          };
        })
      );

      setResources(resourcesWithInteractions);
    } catch (error) {
      console.error('Error loading resource data:', error);
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

    // Tab filter
    if (selectedTab === 'bookmarked') {
      filtered = filtered.filter(resource => resource.user_interaction?.is_bookmarked);
    } else if (selectedTab === 'in-progress') {
      filtered = filtered.filter(resource => 
        resource.user_interaction?.progress_percentage > 0 && 
        resource.user_interaction?.progress_percentage < 100
      );
    } else if (selectedTab === 'completed') {
      filtered = filtered.filter(resource => resource.user_interaction?.progress_percentage === 100);
    }

    setFilteredResources(filtered);
  };

  const toggleBookmark = async (resourceId: string, isBookmarked: boolean) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('user_resource_interactions')
        .upsert({
          user_id: profile.user_id,
          resource_id: resourceId,
          is_bookmarked: !isBookmarked,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setResources(prev => prev.map(resource => 
        resource.id === resourceId 
          ? {
              ...resource,
              user_interaction: {
                ...resource.user_interaction!,
                is_bookmarked: !isBookmarked
              }
            }
          : resource
      ));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Resource Hub</h1>
          <p className="text-muted-foreground">
            Access mental health resources in multiple languages and formats
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
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
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const IconComponent = categoryIcons[category.icon] || BookOpen;
              const categoryResourceCount = resources.filter(r => r.category_id === category.id).length;
              
              return (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedTab('all');
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <IconComponent 
                          className="h-6 w-6" 
                          style={{ color: category.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {categoryResourceCount} resources
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Resources Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              {selectedCategory !== 'all' 
                ? categories.find(c => c.id === selectedCategory)?.name + ' Resources'
                : 'All Resources'
              }
            </h2>
            <Badge variant="outline">
              {filteredResources.length} resources
            </Badge>
          </div>

          {filteredResources.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No resources found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or browse different categories.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => {
                const ContentIcon = getContentTypeIcon(resource.content_type);
                
                return (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {resource.thumbnail_url && (
                        <div className="h-48 bg-cover bg-center rounded-t-lg" 
                             style={{ backgroundImage: `url(${resource.thumbnail_url})` }}>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBookmark(resource.id, resource.user_interaction?.is_bookmarked || false)}
                          className="bg-white/80 hover:bg-white"
                        >
                          {resource.user_interaction?.is_bookmarked ? (
                            <BookmarkCheck className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
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
                          <span>{getLanguageDisplay(resource.language)}</span>
                          {resource.duration_minutes && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(resource.duration_minutes)}
                            </div>
                          )}
                        </div>
                        
                        {resource.average_rating && resource.average_rating > 0 && (
                          <div className="flex items-center">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(resource.average_rating!)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({resource.total_ratings})
                            </span>
                          </div>
                        )}
                        
                        {resource.user_interaction?.progress_percentage > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{resource.user_interaction.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${resource.user_interaction.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full"
                          onClick={() => navigate(`/resources/${resource.id}`)}
                        >
                          View Resource
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceHubDashboard;
