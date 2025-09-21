import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  Users, 
  Heart,
  Sparkles,
  Shield,
  Globe,
  Brain,
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ScreeningQuestionnaire from '@/components/ScreeningQuestionnaire';
import RiskLevelDisplay from '@/components/RiskLevelDisplay';
import heroImage from "@/assets/hero-mental-health.jpg";

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [showScreening, setShowScreening] = useState(false);
  const [screeningType, setScreeningType] = useState<'phq9' | 'gad7'>('phq9');
  const [screeningResult, setScreeningResult] = useState<{ score: number; riskLevel: 'low' | 'medium' | 'high' } | null>(null);
  const [lastScreening, setLastScreening] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchLastScreening();
      fetchPersonalizedResources();
      fetchRecentBookings();
    }
  }, [profile]);

  const fetchLastScreening = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('screening_responses')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      setLastScreening(data[0]);
    }
  };

  const fetchPersonalizedResources = async () => {
    let query = supabase
      .from('resources')
      .select('*')
      .limit(6);
    
    // Filter by risk level if available
    if (lastScreening && lastScreening.risk_level) {
      query = query.eq('risk_level', lastScreening.risk_level);
    }
    
    const { data } = await query;
    setResources(data || []);
  };

  const fetchRecentBookings = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('counselor_bookings')
      .select(`
        *,
        counselor:counselor_id(full_name)
      `)
      .eq('student_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    setRecentBookings(data || []);
  };

  const handleScreeningComplete = (result: { score: number; riskLevel: 'low' | 'medium' | 'high' }) => {
    setScreeningResult(result);
    setShowScreening(false);
    fetchLastScreening(); // Refresh screening data
    fetchPersonalizedResources(); // Refresh resources based on new result
  };

  const startNewScreening = (type: 'phq9' | 'gad7') => {
    setScreeningType(type);
    setShowScreening(true);
    setScreeningResult(null);
  };

  if (showScreening) {
    return (
      <ScreeningQuestionnaire
        type={screeningType}
        onComplete={handleScreeningComplete}
        onClose={() => setShowScreening(false)}
      />
    );
  }

  if (screeningResult) {
    return (
      <RiskLevelDisplay
        riskLevel={screeningResult.riskLevel}
        score={screeningResult.score}
        screeningType={screeningType}
        onRetakeScreening={() => setShowScreening(true)}
      />
    );
  }

  const quickActions = [
    {
      title: "AI Counselor Chat",
      description: "Get immediate support from our AI-powered mental health assistant",
      icon: MessageSquare,
      link: "/chat",
      color: "bg-therapeutic-blue",
      urgent: false
    },
    {
      title: "Book Counseling",
      description: "Schedule a confidential session with a professional counselor",
      icon: Calendar,
      link: "/booking",
      color: "bg-primary",
      urgent: true
    },
    {
      title: "Mental Health Resources",
      description: "Access guides, videos, and tools in Hindi, Urdu, and English",
      icon: BookOpen,
      link: "/resources",
      color: "bg-therapeutic-warm",
      urgent: false
    },
    {
      title: "Peer Support Community",
      description: "Connect anonymously with other students for mutual support",
      icon: Users,
      link: "/community",
      color: "bg-therapeutic-calm",
      urgent: false
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Complete Privacy",
      description: "Your conversations and data are fully encrypted and confidential"
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Available in Hindi, Urdu, and English for better communication"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Support",
      description: "Advanced AI trained to understand cultural context and provide appropriate help"
    }
  ];

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Moderate Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />High Risk</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-therapeutic-calm to-accent py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <Badge variant="secondary" className="mb-2">
                  <Heart className="h-3 w-3 mr-1" />
                  Welcome back, {profile?.full_name || 'Student'}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  Your Mental Health Journey
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Continue your path to better mental wellness with personalized support and resources.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/chat">
                  <Button size="lg" className="w-full sm:w-auto">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chat Now
                  </Button>
                </Link>
                <Link to="/booking">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Counseling
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <img
                src={heroImage}
                alt="Students finding support and community"
                className="rounded-2xl shadow-therapeutic w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Screening Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                <Brain className="h-8 w-8 inline mr-2" />
                Mental Health Assessment
              </h2>
              <p className="text-muted-foreground">
                Regular screening helps track your mental wellness and provides personalized recommendations
              </p>
            </div>

            {lastScreening ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Latest Screening Results</span>
                    {getRiskBadge(lastScreening.risk_level)}
                  </CardTitle>
                  <CardDescription>
                    Completed on {new Date(lastScreening.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {lastScreening.screening_type === 'phq9' ? 'Depression Score (PHQ-9)' : 'Anxiety Score (GAD-7)'}
                      </p>
                      <p className="text-2xl font-bold">
                        {lastScreening.total_score} / {lastScreening.screening_type === 'phq9' ? '27' : '21'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => startNewScreening('phq9')} 
                        variant="outline" 
                        className="w-full"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Retake Depression Screening
                      </Button>
                      <Button 
                        onClick={() => startNewScreening('gad7')} 
                        variant="outline" 
                        className="w-full"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Take Anxiety Screening
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6">
                <CardHeader className="text-center">
                  <CardTitle>Complete Your Mental Health Screening</CardTitle>
                  <CardDescription>
                    Get personalized recommendations based on validated mental health assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => startNewScreening('phq9')} 
                      className="h-20 flex-col space-y-2"
                    >
                      <Brain className="h-6 w-6" />
                      <div>
                        <div className="font-semibold">PHQ-9</div>
                        <div className="text-xs opacity-80">Depression Screening</div>
                      </div>
                    </Button>
                    <Button 
                      onClick={() => startNewScreening('gad7')} 
                      variant="outline" 
                      className="h-20 flex-col space-y-2"
                    >
                      <Heart className="h-6 w-6" />
                      <div>
                        <div className="font-semibold">GAD-7</div>
                        <div className="text-xs opacity-80">Anxiety Screening</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Get Support Your Way
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from multiple support options designed to meet you where you are
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="relative overflow-hidden group hover:shadow-therapeutic transition-all duration-300">
                  {action.urgent && (
                    <Badge className="absolute top-3 right-3 bg-warning text-warning-foreground">
                      Priority
                    </Badge>
                  )}
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={action.link}>
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Get Started
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Personalized Resources */}
      {resources.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Recommended for You
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Personalized resources based on your screening results
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {resource.content_type}
                      </Badge>
                      <Badge variant="outline">
                        {resource.language}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose ManoSaathi?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform is designed for the unique needs of students in J&K
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-12 bg-warning/10 border-t border-warning/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Need Immediate Help?
            </h3>
            <p className="text-muted-foreground mb-4">
              If you're experiencing a mental health crisis, please reach out immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="destructive" size="lg">
                <Heart className="h-4 w-4 mr-2" />
                Emergency Support: 1950
              </Button>
              <Link to="/chat">
                <Button variant="outline" size="lg">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Crisis Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;