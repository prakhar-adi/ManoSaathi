import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare,
  Home,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const BookingSuccess: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [counselor, setCounselor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('counselor_bookings')
        .select(`
          *,
          counselor:counselor_id(
            id,
            name,
            hourly_rate
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      setBooking(bookingData);
      setCounselor(bookingData.counselor);
    } catch (error) {
      console.error('Error loading booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Confirmation</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Booking not found</h2>
          <Button onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-therapeutic-calm to-accent">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your counseling session has been successfully booked
            </p>
          </div>

          {/* Booking Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Session Details
              </CardTitle>
              <CardDescription>
                Here are the details of your upcoming counseling session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                {getStatusBadge(booking.status)}
              </div>

              {/* Booking ID */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Booking ID:</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {booking.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              {/* Counselor */}
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{counselor?.name || 'Counselor'}</p>
                  <p className="text-sm text-muted-foreground">Your assigned counselor</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{formatDate(booking.appointment_date)}</p>
                  <p className="text-sm text-muted-foreground">Session date</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{formatTime(booking.appointment_date)}</p>
                  <p className="text-sm text-muted-foreground">Session time</p>
                </div>
              </div>

              {/* Communication Mode */}
              {booking.communication_mode && (
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium capitalize">{booking.communication_mode} Session</p>
                    <p className="text-sm text-muted-foreground">Communication method</p>
                  </div>
                </div>
              )}

              {/* Session Fee */}
              {counselor?.hourly_rate && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Session Fee:</span>
                    <span className="text-primary font-semibold">₹{counselor.hourly_rate}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {booking.notes && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Session Notes:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {booking.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Confirmation</p>
                  <p className="text-sm text-muted-foreground">
                    Your counselor will review and confirm your booking within 24 hours
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Session Details</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive session details and meeting link via notification
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Attend Session</p>
                  <p className="text-sm text-muted-foreground">
                    Join your session at the scheduled time using the provided link
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Try AI Support
            </Button>
          </div>

          {/* Important Notice */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> If you need to cancel or reschedule, please contact your counselor 
              at least 24 hours in advance. For immediate mental health support, call KIRAN: 1800-599-0019
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
