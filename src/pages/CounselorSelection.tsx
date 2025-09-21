import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Languages, 
  ArrowRight,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CounselorProfile {
  id: string;
  name: string;
  specialization: string[];
  languages: string[];
  experience_years: number;
  bio: string;
  hourly_rate: number;
  is_active: boolean;
}

const CounselorSelection: React.FC = () => {
  const [counselors, setCounselors] = useState<CounselorProfile[]>([]);
  const [filteredCounselors, setFilteredCounselors] = useState<CounselorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const specializations = [
    'anxiety', 'depression', 'academic-stress', 'family-issues', 
    'relationship-problems', 'trauma', 'addiction', 'grief'
  ];

  const languages = ['english', 'hindi', 'urdu'];

  useEffect(() => {
    loadCounselors();
  }, []);

  useEffect(() => {
    filterCounselors();
  }, [counselors, searchQuery, selectedSpecialization, selectedLanguage]);

  const loadCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('counselor_profiles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      setCounselors(data || []);
    } catch (error) {
      console.error('Error loading counselors:', error);
      // Fallback to mock data if database is not available
      const mockCounselors: CounselorProfile[] = [
        {
          id: '1',
          name: 'Dr. Priya Sharma',
          specialization: ['anxiety', 'depression', 'academic-stress'],
          languages: ['english', 'hindi'],
          experience_years: 8,
          bio: 'Experienced counselor specializing in student mental health and academic stress management.',
          hourly_rate: 1500,
          is_active: true
        },
        {
          id: '2',
          name: 'Dr. Rajesh Kumar',
          specialization: ['family-issues', 'relationship-problems'],
          languages: ['english', 'hindi', 'urdu'],
          experience_years: 12,
          bio: 'Senior counselor with expertise in family dynamics and relationship counseling.',
          hourly_rate: 2000,
          is_active: true
        }
      ];
      
      setCounselors(mockCounselors);
    } finally {
      setLoading(false);
    }
  };

  const filterCounselors = () => {
    let filtered = counselors;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(counselor =>
        counselor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        counselor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        counselor.specialization.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Specialization filter
    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(counselor =>
        counselor.specialization.includes(selectedSpecialization)
      );
    }

    // Language filter
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(counselor =>
        counselor.languages.includes(selectedLanguage)
      );
    }

    setFilteredCounselors(filtered);
  };

  const handleSelectCounselor = (counselorId: string) => {
    // Store selected counselor in session storage
    const bookingData = JSON.parse(sessionStorage.getItem('bookingUser') || '{}');
    bookingData.counselorId = counselorId;
    sessionStorage.setItem('bookingUser', JSON.stringify(bookingData));
    
    // Navigate to availability page
    window.location.href = `/booking/availability/${counselorId}`;
  };

  const getSpecializationDisplay = (spec: string) => {
    const displayNames: { [key: string]: string } = {
      'anxiety': 'Anxiety',
      'depression': 'Depression',
      'academic-stress': 'Academic Stress',
      'family-issues': 'Family Issues',
      'relationship-problems': 'Relationships',
      'trauma': 'Trauma',
      'addiction': 'Addiction',
      'grief': 'Grief & Loss'
    };
    return displayNames[spec] || spec;
  };

  const getLanguageDisplay = (lang: string) => {
    const displayNames: { [key: string]: string } = {
      'english': 'English',
      'hindi': 'हिंदी',
      'urdu': 'اردو'
    };
    return displayNames[lang] || lang;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading counselors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Select a Counselor</h1>
              <p className="text-muted-foreground">
                Choose from our qualified mental health professionals
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search counselors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Specialization Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Specialization</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                  >
                    <option value="all">All Specializations</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>
                        {getSpecializationDisplay(spec)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Language</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="all">All Languages</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>
                        {getLanguageDisplay(lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Counselors List */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <p className="text-muted-foreground">
                {filteredCounselors.length} counselor{filteredCounselors.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="space-y-4">
              {filteredCounselors.map(counselor => (
                <Card key={counselor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{counselor.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{counselor.experience_years} years experience</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">{counselor.bio}</p>

                        {/* Specializations */}
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-2">Specializations:</h4>
                          <div className="flex flex-wrap gap-2">
                            {counselor.specialization.map(spec => (
                              <Badge key={spec} variant="secondary">
                                {getSpecializationDisplay(spec)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Languages */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Languages className="h-4 w-4" />
                            Languages:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {counselor.languages.map(lang => (
                              <Badge key={lang} variant="outline">
                                {getLanguageDisplay(lang)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Rate */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Rate:</span>
                          <span className="text-primary">₹{counselor.hourly_rate}/hour</span>
                        </div>
                      </div>

                      <div className="ml-6">
                        <Button 
                          onClick={() => handleSelectCounselor(counselor.id)}
                          className="flex items-center gap-2"
                        >
                          <Calendar className="h-4 w-4" />
                          Book Session
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCounselors.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No counselors found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search terms to find available counselors.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounselorSelection;
