import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Eye, Lock, Heart, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BookingEntry: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<'campus' | 'anonymous' | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selectedOption) return;
    
    // Store booking preference in session storage
    const bookingData = {
      type: selectedOption,
      timestamp: new Date().toISOString()
    };
    sessionStorage.setItem('bookingUser', JSON.stringify(bookingData));
    
    navigate('/booking/counselors');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-therapeutic-calm to-accent p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Book a Counselor</h1>
          <p className="text-lg text-muted-foreground">
            Connect with qualified mental health professionals
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
                  <CardTitle>Book with Campus ID</CardTitle>
                </div>
                <CardDescription>
                  Use your college credentials for booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Eye className="h-4 w-4" />
                    <span>Verified student identity</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Calendar className="h-4 w-4" />
                    <span>Priority booking slots</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Secure booking process</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anonymous Option */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedOption('anonymous')}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-6 w-6 text-purple-600" />
                  <CardTitle>Book Anonymously</CardTitle>
                </div>
                <CardDescription>
                  Complete privacy with anonymous booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Lock className="h-4 w-4" />
                    <span>100% anonymous</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Calendar className="h-4 w-4" />
                    <span>Access to all counselors</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>Auto-generated booking ID</span>
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
                Booking Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Heart className="h-4 w-4" />
                <AlertDescription>
                  Please read these important guidelines before booking your counseling session.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">✓</div>
                  <div>
                    <strong>Confidentiality:</strong> All sessions are completely confidential and secure
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">✓</div>
                  <div>
                    <strong>Professional counselors:</strong> All counselors are qualified and experienced
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">✓</div>
                  <div>
                    <strong>Flexible scheduling:</strong> Choose from available time slots that work for you
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm font-bold">!</div>
                  <div>
                    <strong>Cancellation policy:</strong> Please cancel at least 24 hours in advance
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm font-bold">!</div>
                  <div>
                    <strong>Emergency situations:</strong> For immediate help, call KIRAN: 1800-599-0019
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
              <Button onClick={handleContinue} disabled={!selectedOption}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Browse Counselors
              </Button>
            </>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Your privacy is protected. All sessions are confidential and secure.
            <br />
            In case of crisis, professional help is available 24/7.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingEntry;
