import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Save,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
}

const CounselorAvailabilityManager: React.FC = () => {
  const { profile } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    if (profile?.role === 'counselor') {
      loadAvailability();
      loadTimeSlots();
    }
  }, [profile]);

  const loadAvailability = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Get counselor profile ID
      const { data: counselorProfile } = await supabase
        .from('counselor_profiles')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

      if (!counselorProfile) {
        // No counselor profile exists yet, start with empty availability
        setAvailability([]);
        return;
      }

      const { data, error } = await supabase
        .from('counselor_availability')
        .select('*')
        .eq('counselor_id', counselorProfile.id)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlots = async () => {
    if (!profile) return;
    
    try {
      // Get counselor profile ID
      const { data: counselorProfile } = await supabase
        .from('counselor_profiles')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

      if (!counselorProfile) {
        // No counselor profile exists yet, start with empty time slots
        setTimeSlots([]);
        return;
      }

      const { data, error } = await supabase
        .from('counselor_time_slots')
        .select('*')
        .eq('counselor_id', counselorProfile.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('start_time')
        .limit(50);

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setTimeSlots([]);
    }
  };

  const addAvailabilitySlot = (dayOfWeek: number) => {
    const newSlot: AvailabilitySlot = {
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true
    };
    setAvailability(prev => [...prev, newSlot]);
  };

  const updateAvailabilitySlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    setAvailability(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailability(prev => prev.filter((_, i) => i !== index));
  };

  const saveAvailability = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      // Get or create counselor profile ID
      let counselorProfile = await supabase
        .from('counselor_profiles')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

      if (!counselorProfile.data) {
        // Create counselor profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('counselor_profiles')
          .insert({
            user_id: profile.user_id,
            name: profile.full_name || 'Dr. ' + profile.email?.split('@')[0] || 'Counselor',
            specialization: ['general-counseling'],
            languages: ['english'],
            experience_years: 1,
            bio: 'Professional counselor providing mental health support to students.',
            hourly_rate: 1500,
            is_active: true
          })
          .select('id')
          .single();

        if (createError) throw createError;
        counselorProfile = { data: newProfile };
      }

      if (!counselorProfile.data) throw new Error('Failed to create or find counselor profile');

      // Delete existing availability
      await supabase
        .from('counselor_availability')
        .delete()
        .eq('counselor_id', counselorProfile.data.id);

      // Insert new availability
      const availabilityToInsert = availability.map(slot => ({
        counselor_id: counselorProfile.data.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available
      }));

      const { error } = await supabase
        .from('counselor_availability')
        .insert(availabilityToInsert);

      if (error) throw error;

      // Regenerate time slots for the next 30 days
      console.log('Regenerating time slots after saving availability...');
      await regenerateTimeSlots();

      alert('Availability saved successfully! Time slots have been generated.');
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const regenerateTimeSlots = async () => {
    try {
      // Get counselor profile ID first
      const { data: counselorProfile } = await supabase
        .from('counselor_profiles')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      if (!counselorProfile) {
        console.error('No counselor profile found for time slot regeneration');
        return;
      }

      // Generate time slots for the next 30 days
      const today = new Date();
      console.log('Generating time slots for the next 30 days starting from:', today.toISOString().split('T')[0]);
      
      for (let i = 0; i < 30; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        
        console.log(`Generating time slots for date: ${targetDate.toISOString().split('T')[0]}`);
        
        const { error } = await supabase.rpc('create_time_slots_for_date', {
          target_date: targetDate.toISOString().split('T')[0]
        });

        if (error) {
          console.error(`Error creating time slots for ${targetDate.toISOString().split('T')[0]}:`, error);
        } else {
          console.log(`Successfully generated time slots for ${targetDate.toISOString().split('T')[0]}`);
        }
      }

      loadTimeSlots();
    } catch (error) {
      console.error('Error regenerating time slots:', error);
    }
  };

  const blockTimeSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('counselor_time_slots')
        .update({ status: 'blocked' })
        .eq('id', slotId);

      if (error) throw error;
      loadTimeSlots();
    } catch (error) {
      console.error('Error blocking time slot:', error);
    }
  };

  const unblockTimeSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('counselor_time_slots')
        .update({ status: 'available' })
        .eq('id', slotId);

      if (error) throw error;
      loadTimeSlots();
    } catch (error) {
      console.error('Error unblocking time slot:', error);
    }
  };

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availability.filter(slot => slot.day_of_week === dayOfWeek);
  };

  const getTimeSlotsForDate = (date: string) => {
    return timeSlots.filter(slot => slot.date === date);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'booked':
        return <Badge className="bg-blue-100 text-blue-800">Booked</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="specific">Specific Dates</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Availability
              </CardTitle>
              <CardDescription>
                Set your regular weekly availability. Students will be able to book sessions during these times.
                {availability.length === 0 && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Getting Started:</strong> Add time slots for each day you're available. 
                      You can add multiple time slots per day (e.g., morning and evening sessions).
                    </p>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {daysOfWeek.map((day, dayIndex) => {
                const dayAvailability = getAvailabilityForDay(dayIndex);
                
                return (
                  <div key={dayIndex} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{day}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addAvailabilitySlot(dayIndex)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Slot
                      </Button>
                    </div>
                    
                    {dayAvailability.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-lg">
                        <p>No availability set for {day}</p>
                        <p className="text-xs mt-1">Click "Add Slot" to set your working hours</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayAvailability.map((slot, slotIndex) => {
                          const globalIndex = availability.findIndex(s => s === slot);
                          return (
                            <div key={slotIndex} className="flex items-center gap-3 p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`start-${globalIndex}`} className="text-sm">From:</Label>
                                <Input
                                  id={`start-${globalIndex}`}
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(e) => updateAvailabilitySlot(globalIndex, 'start_time', e.target.value)}
                                  className="w-32"
                                />
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`end-${globalIndex}`} className="text-sm">To:</Label>
                                <Input
                                  id={`end-${globalIndex}`}
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) => updateAvailabilitySlot(globalIndex, 'end_time', e.target.value)}
                                  className="w-32"
                                />
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAvailabilitySlot(globalIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={saveAvailability} 
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Weekly Schedule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specific" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Specific Date Management
              </CardTitle>
              <CardDescription>
                View and manage time slots for specific dates. Block or unblock individual slots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="date-select">Select Date:</Label>
                <Input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-48 mt-2"
                />
              </div>

              {selectedDate && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      Time Slots for {new Date(selectedDate).toLocaleDateString()}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={regenerateTimeSlots}
                    >
                      Regenerate Slots
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {getTimeSlotsForDate(selectedDate).map((slot) => (
                      <div key={slot.id} className="p-3 border rounded-lg space-y-2">
                        <div className="text-center">
                          <p className="font-medium">{formatTime(slot.start_time)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(slot.end_time)}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          {getStatusBadge(slot.status)}
                        </div>
                        
                        <div className="flex gap-1">
                          {slot.status === 'available' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => blockTimeSlot(slot.id)}
                              className="flex-1 text-xs"
                            >
                              Block
                            </Button>
                          )}
                          {slot.status === 'blocked' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unblockTimeSlot(slot.id)}
                              className="flex-1 text-xs"
                            >
                              Unblock
                            </Button>
                          )}
                          {slot.status === 'booked' && (
                            <div className="text-xs text-center text-muted-foreground">
                              Booked
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {getTimeSlotsForDate(selectedDate).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No time slots available for this date</p>
                      <p className="text-sm">Set your weekly availability first</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CounselorAvailabilityManager;
