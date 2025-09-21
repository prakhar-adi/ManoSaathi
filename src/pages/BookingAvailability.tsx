import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
}

interface CounselorProfile {
  id: string;
  name: string;
  specialization: string[];
  languages: string[];
  experience_years: number;
  bio: string;
  hourly_rate: number;
}

const BookingAvailability: React.FC = () => {
  const { counselorId } = useParams<{ counselorId: string }>();
  const navigate = useNavigate();
  const [counselor, setCounselor] = useState<CounselorProfile | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(0);

  useEffect(() => {
    if (counselorId) {
      loadCounselorDetails();
      loadTimeSlots();
    }
  }, [counselorId, currentWeek]);

  const loadCounselorDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('counselor_profiles')
        .select('*')
        .eq('id', counselorId)
        .single();

      if (error) throw error;
      setCounselor(data);
    } catch (error) {
      console.error('Error loading counselor details:', error);
      // Fallback to mock data
      const mockCounselor: CounselorProfile = {
        id: counselorId || '1',
        name: 'Dr. Priya Sharma',
        specialization: ['anxiety', 'depression', 'academic-stress'],
        languages: ['english', 'hindi'],
        experience_years: 8,
        bio: 'Experienced counselor specializing in student mental health and academic stress management.',
        hourly_rate: 1500
      };
      setCounselor(mockCounselor);
    }
  };

  const loadTimeSlots = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (currentWeek * 7));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      console.log('Loading time slots for counselor:', counselorId);
      console.log('Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

      const { data, error } = await supabase
        .from('counselor_time_slots')
        .select('*')
        .eq('counselor_id', counselorId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date')
        .order('start_time');

      if (error) {
        console.error('Error loading time slots:', error);
        throw error;
      }
      
      console.log('Loaded time slots:', data);
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error loading time slots:', error);
      // If no time slots found, try to generate them
      console.log('Attempting to generate time slots...');
      try {
        const { error: rpcError } = await supabase.rpc('create_time_slots_for_date', {
          target_date: startDate.toISOString().split('T')[0]
        });
        
        if (rpcError) {
          console.error('Error generating time slots:', rpcError);
        } else {
          console.log('Time slots generated, retrying load...');
          // Retry loading time slots
          const { data: retryData, error: retryError } = await supabase
            .from('counselor_time_slots')
            .select('*')
            .eq('counselor_id', counselorId)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0])
            .order('date')
            .order('start_time');
          
          if (!retryError) {
            setTimeSlots(retryData || []);
          }
        }
      } catch (genError) {
        console.error('Error in time slot generation fallback:', genError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (currentWeek * 7));
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const getSlotsForDate = (date: string) => {
    return timeSlots.filter(slot => slot.date === date);
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
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSlotSelect = (slotId: string, date: string) => {
    setSelectedSlot(slotId);
    setSelectedDate(date);
  };

  const handleContinue = () => {
    if (!selectedSlot || !selectedDate) return;
    
    // Store selected slot in session storage
    const bookingData = JSON.parse(sessionStorage.getItem('bookingUser') || '{}');
    bookingData.timeSlotId = selectedSlot;
    bookingData.selectedDate = selectedDate;
    sessionStorage.setItem('bookingUser', JSON.stringify(bookingData));
    
    // Navigate to booking form
    navigate('/booking/form');
  };

  const isSlotAvailable = (slot: TimeSlot) => {
    return slot.status === 'available' && new Date(slot.date) >= new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading availability...</p>
        </div>
      </div>
    );
  }

  if (!counselor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Counselor not found</h2>
          <Button onClick={() => navigate('/booking/counselors')}>
            Back to Counselors
          </Button>
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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/booking/counselors')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Select Time Slot</h1>
                <p className="text-muted-foreground">
                  Choose an available time for your session with {counselor.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Counselor Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {counselor.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Specializations:</h4>
                  <div className="flex flex-wrap gap-1">
                    {counselor.specialization.map(spec => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec.replace('-', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Languages:</h4>
                  <div className="flex flex-wrap gap-1">
                    {counselor.languages.map(lang => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{counselor.experience_years} years experience</span>
                </div>

                <div className="text-sm">
                  <span className="font-medium">Rate: </span>
                  <span className="text-primary">₹{counselor.hourly_rate}/hour</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Available Time Slots
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWeek(prev => prev - 1)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Week {currentWeek + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWeek(prev => prev + 1)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {getWeekDates().map((date, index) => (
                    <div key={index} className="text-center">
                      <div className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {getWeekDates().map((date, index) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const slots = getSlotsForDate(dateStr);
                    
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">{formatDate(dateStr)}</h3>
                          <Badge variant="outline" className="text-xs">
                            {slots.filter(slot => isSlotAvailable(slot)).length} available
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {slots.map(slot => {
                            const isAvailable = isSlotAvailable(slot);
                            const isSelected = selectedSlot === slot.id;
                            
                            return (
                              <Button
                                key={slot.id}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                disabled={!isAvailable}
                                onClick={() => handleSlotSelect(slot.id, dateStr)}
                                className="flex items-center gap-1 text-xs"
                              >
                                {isAvailable ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {formatTime(slot.start_time)}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedSlot && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Selected Slot:</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedDate)} at {formatTime(timeSlots.find(s => s.id === selectedSlot)?.start_time || '')}
                        </p>
                      </div>
                      <Button onClick={handleContinue}>
                        Continue to Booking
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAvailability;
