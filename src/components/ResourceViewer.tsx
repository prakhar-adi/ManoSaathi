import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  Star,
  Clock,
  ExternalLink,
  FileText,
  Headphones,
  Share2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  category: {
    id: string;
    name: string;
    color: string;
  };
  user_interaction?: {
    is_bookmarked: boolean;
    rating?: number;
    progress_percentage: number;
  };
  average_rating?: number;
  total_ratings?: number;
}

const ResourceViewer: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (resourceId) {
      loadResource();
    }
  }, [resourceId]);

  useEffect(() => {
    if (resource && profile) {
      updateProgress();
    }
  }, [currentTime, duration, resource, profile]);

  const loadResource = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          category:resource_categories(*)
        `)
        .eq('id', resourceId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Resource not found');
        return;
      }

      // Load user interaction
      let userInteraction = null;
      if (profile) {
        const { data: interaction } = await supabase
          .from('user_resource_interactions')
          .select('is_bookmarked, rating, progress_percentage')
          .eq('user_id', profile.user_id)
          .eq('resource_id', resourceId)
          .single();

        userInteraction = interaction || { is_bookmarked: false, progress_percentage: 0 };
        setUserRating(interaction?.rating || 0);
        setProgress(interaction?.progress_percentage || 0);
      }

      // Get average rating
      const { data: ratings } = await supabase
        .from('user_resource_interactions')
        .select('rating')
        .eq('resource_id', resourceId)
        .not('rating', 'is', null);

      const totalRatings = ratings?.length || 0;
      const averageRating = totalRatings > 0 
        ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / totalRatings 
        : 0;

      setResource({
        ...data,
        user_interaction: userInteraction,
        average_rating: averageRating,
        total_ratings: totalRatings
      });
    } catch (error) {
      console.error('Error loading resource:', error);
      setError('Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    if (!resource || !profile || !duration) return;

    const progressPercentage = Math.round((currentTime / duration) * 100);
    
    if (progressPercentage > progress) {
      try {
        await supabase
          .from('user_resource_interactions')
          .upsert({
            user_id: profile.user_id,
            resource_id: resource.id,
            progress_percentage: progressPercentage,
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        setProgress(progressPercentage);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  const toggleBookmark = async () => {
    if (!resource || !profile) return;

    try {
      const { error } = await supabase
        .from('user_resource_interactions')
        .upsert({
          user_id: profile.user_id,
          resource_id: resource.id,
          is_bookmarked: !resource.user_interaction?.is_bookmarked,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setResource(prev => prev ? {
        ...prev,
        user_interaction: {
          ...prev.user_interaction!,
          is_bookmarked: !prev.user_interaction?.is_bookmarked
        }
      } : null);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!resource || !profile) return;

    try {
      const { error } = await supabase
        .from('user_resource_interactions')
        .upsert({
          user_id: profile.user_id,
          resource_id: resource.id,
          rating: rating,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setUserRating(rating);
      setResource(prev => prev ? {
        ...prev,
        user_interaction: {
          ...prev.user_interaction!,
          rating: rating
        }
      } : null);

      // Reload resource to get updated average rating
      loadResource();
    } catch (error) {
      console.error('Error updating rating:', error);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMediaEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (resource && profile) {
      // Mark as completed
      supabase
        .from('user_resource_interactions')
        .upsert({
          user_id: profile.user_id,
          resource_id: resource.id,
          progress_percentage: 100,
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      setProgress(100);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
    const target = e.target as HTMLVideoElement | HTMLAudioElement;
    setCurrentTime(target.currentTime);
    setDuration(target.duration);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Resource Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The resource you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/resources')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Resources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/resources')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
            {profile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBookmark}
              >
                {resource.user_interaction?.is_bookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-blue-600" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Resource Content */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{resource.title}</CardTitle>
                <CardDescription className="text-base mb-4">
                  {resource.description}
                </CardDescription>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <Badge 
                    variant="secondary"
                    style={{ backgroundColor: `${resource.category.color}20`, color: resource.category.color }}
                  >
                    {resource.category.name}
                  </Badge>
                  <span>{getLanguageDisplay(resource.language)}</span>
                  {resource.duration_minutes && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(resource.duration_minutes)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Media Player */}
            {resource.content_type === 'video' && resource.content_url && (
              <div className="mb-6">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    className="w-full h-auto"
                    controls
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleMediaEnded}
                    poster={resource.thumbnail_url}
                  >
                    <source src={resource.content_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                {duration > 0 && (
                  <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                )}
              </div>
            )}

            {resource.content_type === 'audio' && resource.content_url && (
              <div className="mb-6">
                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1">
                      <audio
                        ref={(audio) => {
                          if (audio) {
                            audio.onplay = () => setIsPlaying(true);
                            audio.onpause = () => setIsPlaying(false);
                            audio.ontimeupdate = (e) => handleTimeUpdate(e);
                            audio.onended = handleMediaEnded;
                          }
                        }}
                        controls
                        className="w-full"
                      >
                        <source src={resource.content_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {resource.content_type === 'article' && resource.content_text && (
              <div className="mb-6">
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: resource.content_text.replace(/\n/g, '<br>') }} />
                </div>
              </div>
            )}

            {resource.content_type === 'link' && resource.content_url && (
              <div className="mb-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">External Resource</h3>
                    <p className="text-muted-foreground mb-4">
                      This resource is hosted on an external website.
                    </p>
                    <Button asChild>
                      <a 
                        href={resource.content_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (resource && profile) {
                            // Mark as completed when user clicks external link
                            supabase
                              .from('user_resource_interactions')
                              .upsert({
                                user_id: profile.user_id,
                                resource_id: resource.id,
                                progress_percentage: 100,
                                last_accessed_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                              });
                            setProgress(100);
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open External Link
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Progress Bar */}
            {profile && progress > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Rating Section */}
            {profile && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Rate this resource</h3>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (hoveredRating || userRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {resource.average_rating && resource.average_rating > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      Average: {resource.average_rating.toFixed(1)} ({resource.total_ratings} ratings)
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResourceViewer;
