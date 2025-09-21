import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Phone,
  Video
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BookingData {
  type: 'campus' | 'anonymous';
  counselorId: string;
  timeSlotId: string;
  selectedDate: string;
}

const BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [counselor, setCounselor] = useState<any>(null);
  const [timeSlot, setTimeSlot] = useState<any>(null);
  const [formData, setFormData] = useState({
    reason: '',
    communicationMode: 'video',
    anonymousId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookingData();
  }, []);

  const loadBookingData = async () => {
    try {
      const stored = sessionStorage.getItem('bookingUser');
      if (!stored) {
        navigate('/booking');
        return;
      }

      const data = JSON.parse(stored);
      setBookingData(data);

      // Load counselor details
      const { data: counselorData, error: counselorError } = await supabase
        .from('counselor_profiles')
        .select('*')
        .eq('id', data.counselorId)
        .single();

      if (counselorError) {
        console.error('Error loading counselor:', counselorError);
        // Fallback to mock data
        const mockCounselor = {
          id: data.counselorId,
          name: 'Dr. Priya Sharma',
          hourly_rate: 1500
        };
        setCounselor(mockCounselor);
      } else {
        setCounselor(counselorData);
      }

      // Load time slot details
      const { data: slotData, error: slotError } = await supabase
        .from('counselor_time_slots')
        .select('*')
        .eq('id', data.timeSlotId)
        .single();

      if (slotError) {
        console.error('Error loading time slot:', slotError);
        // Fallback to mock data
        const mockSlot = {
          id: data.timeSlotId,
          start_time: '10:00',
          end_time: '11:00'
        };
        setTimeSlot(mockSlot);
      } else {
        setTimeSlot(slotData);
      }

      // Auto-populate anonymous ID if needed
      if (data.type === 'anonymous') {
        setFormData(prev => ({
          ...prev,
          anonymousId: `Anonymous_${Date.now().toString().slice(-6)}`
        }));
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
      setError('Failed to load booking information. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!bookingData || !user || !counselor || !timeSlot) {
        throw new Error('Missing booking information');
      }

      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('counselor_bookings')
        .insert({
          student_id: user.id,
          counselor_id: bookingData.counselorId,
          appointment_date: `${bookingData.selectedDate}T${timeSlot.start_time}`,
          status: 'pending',
          notes: formData.reason,
          student_anonymous_id: bookingData.type === 'anonymous' ? formData.anonymousId : null,
          communication_mode: formData.communicationMode,
          time_slot_id: bookingData.timeSlotId
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Clear session storage
      sessionStorage.removeItem('bookingUser');

      // Navigate to success page
      navigate(`/booking/success/${booking.id}`);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setError(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!bookingData || !counselor || !timeSlot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading booking form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/booking/availability/' + bookingData.counselorId)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Complete Your Booking</h1>
              <p className="text-muted-foreground">
                Review your session details and provide additional information
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Session Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Session Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{counselor.name}</h4>
                    <p className="text-sm text-muted-foreground">Counselor</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{formatDate(bookingData.selectedDate)}</h4>
                    <p className="text-sm text-muted-foreground">Date</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{formatTime(timeSlot.start_time)} - {formatTime(timeSlot.end_time)}</h4>
                    <p className="text-sm text-muted-foreground">Time</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Session Fee:</span>
                    <span className="text-primary font-semibold">₹{counselor.hourly_rate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
                <CardDescription>
                  Please provide the following details to complete your booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Student Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Student Information</h3>
                    
                    <div>
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input
                        id="studentId"
                        value={profile?.email || user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This will be used to identify you for the session
                      </p>
                    </div>

                    {bookingData.type === 'anonymous' && (
                      <div>
                        <Label htmlFor="anonymousId">Anonymous ID</Label>
                        <Input
                          id="anonymousId"
                          value={formData.anonymousId}
                          onChange={(e) => setFormData(prev => ({ ...prev, anonymousId: e.target.value }))}
                          placeholder="Enter your anonymous identifier"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This will be used to maintain your anonymity during the session
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Communication Mode */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Communication Mode</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        type="button"
                        variant={formData.communicationMode === 'video' ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, communicationMode: 'video' }))}
                        className="flex flex-col items-center gap-2 h-auto p-4"
                      >
                        <Video className="h-6 w-6" />
                        <span>Video Call</span>
                      </Button>
                      <Button
                        type="button"
                        variant={formData.communicationMode === 'audio' ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, communicationMode: 'audio' }))}
                        className="flex flex-col items-center gap-2 h-auto p-4"
                      >
                        <Phone className="h-6 w-6" />
                        <span>Audio Call</span>
                      </Button>
                      <Button
                        type="button"
                        variant={formData.communicationMode === 'chat' ? 'default' : 'outline'}
                        onClick={() => setFormData(prev => ({ ...prev, communicationMode: 'chat' }))}
                        className="flex flex-col items-center gap-2 h-auto p-4"
                      >
                        <MessageSquare className="h-6 w-6" />
                        <span>Chat</span>
                      </Button>
                    </div>
                  </div>

                  {/* Reason for Session */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Reason for Session (Optional)</h3>
                    <div>
                      <Label htmlFor="reason">What would you like to discuss?</Label>
                      <Textarea
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Briefly describe what you'd like to discuss during your session..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This helps the counselor prepare for your session
                      </p>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        By booking this session, you agree to our terms of service and privacy policy. 
                        Your session will be confidential and secure.
                      </AlertDescription>
                    </Alert>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/booking/availability/' + bookingData.counselorId)}
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating Booking...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
