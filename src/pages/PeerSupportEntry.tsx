import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Eye, Lock, Heart, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PeerSupportEntry: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<'campus' | 'anonymous' | null>(null);
  const [collegeName, setCollegeName] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const navigate = useNavigate();

  const handleJoin = () => {
    if (selectedOption === 'campus' && !collegeName.trim()) {
      return;
    }
    
    // Store user preference in session storage
    const userData = {
      type: selectedOption,
      collegeName: selectedOption === 'campus' ? collegeName.trim() : null,
      joinedAt: new Date().toISOString()
    };
    sessionStorage.setItem('peerSupportUser', JSON.stringify(userData));
    
    navigate('/peer-support/forum');
  };

  const campusColleges = [
    'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
    'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad', 'IIT Indore', 'IIT Mandi',
    'NIT Trichy', 'NIT Surathkal', 'NIT Warangal', 'NIT Calicut', 'NIT Rourkela',
    'BITS Pilani', 'BITS Goa', 'BITS Hyderabad', 'VIT Vellore', 'SRM Chennai',
    'Manipal Institute of Technology', 'Thapar University', 'DTU Delhi', 'NSIT Delhi',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-therapeutic-calm to-accent p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Peer Support Community</h1>
          <p className="text-lg text-muted-foreground">
            Connect with fellow students who understand your journey
          </p>
        </div>

        {!showGuidelines ? (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Campus ID Option */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => setSelectedOption('campus')}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <CardTitle>Join with Campus ID</CardTitle>
                </div>
                <CardDescription>
                  Connect with students from your college
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Eye className="h-4 w-4" />
                    <span>Visible to college peers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Users className="h-4 w-4" />
                    <span>Access to college-specific discussions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Your identity remains private</span>
                  </div>
                </div>
                {selectedOption === 'campus' && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="college">Select your college</Label>
                    <select 
                      id="college"
                      className="w-full p-2 border rounded-md"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                    >
                      <option value="">Choose your college...</option>
                      {campusColleges.map(college => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Anonymous Option */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedOption('anonymous')}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-6 w-6 text-purple-600" />
                  <CardTitle>Join Anonymously</CardTitle>
                </div>
                <CardDescription>
                  Complete privacy with auto-generated identity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Lock className="h-4 w-4" />
                    <span>100% anonymous</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Users className="h-4 w-4" />
                    <span>Access to all discussions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>Auto-generated friendly name</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                Community Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This is a peer support community for mental wellness. Please read and follow these guidelines.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">✓</div>
                  <div>
                    <strong>Share your experiences:</strong> Help others by sharing what worked for you
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">✓</div>
                  <div>
                    <strong>Be supportive:</strong> Offer empathy, encouragement, and understanding
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold">✗</div>
                  <div>
                    <strong>No medical advice:</strong> We're peers, not medical professionals
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold">✗</div>
                  <div>
                    <strong>No personal information:</strong> Keep your identity and contact details private
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold">✗</div>
                  <div>
                    <strong>No harmful content:</strong> Report any content that could harm others
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-4">
          {!showGuidelines ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Back to Dashboard
              </Button>
              {selectedOption && (
                <Button onClick={() => setShowGuidelines(true)}>
                  Continue to Guidelines
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowGuidelines(false)}
              >
                Back
              </Button>
              <Button onClick={handleJoin} disabled={selectedOption === 'campus' && !collegeName.trim()}>
                Join Community
              </Button>
            </>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Your privacy is protected. All conversations are moderated for safety.
            <br />
            In case of crisis, professional help is available 24/7.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PeerSupportEntry;
