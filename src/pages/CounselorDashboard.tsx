import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Brain,
  Heart,
  Activity,
  TrendingUp
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CounselorAvailabilityManager from '@/components/CounselorAvailabilityManager';
import AdminResourceManagement from '@/components/AdminResourceManagement';

const CounselorDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    pendingBookings: 0,
    completedSessions: 0
  });
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [highRiskStudents, setHighRiskStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'counselor') {
      fetchCounselorData();
    }
  }, [profile]);

  const fetchCounselorData = async () => {
    setLoading(true);
    
    try {
      // First get the counselor profile ID
      const { data: counselorProfile } = await supabase
        .from('counselor_profiles')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      if (!counselorProfile) {
        console.log('No counselor profile found for user');
        setLoading(false);
        return;
      }

      // Fetch counselor's bookings using the counselor profile ID
      const { data: bookings } = await supabase
        .from('counselor_bookings')
        .select(`
          *,
          student:student_id(full_name, email)
        `)
        .eq('counselor_id', counselorProfile.id)
        .order('appointment_date', { ascending: true });

      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookings?.filter(b => 
        b.appointment_date.startsWith(today)
      ).length || 0;
      
      const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
      const completedSessions = bookings?.filter(b => b.status === 'completed').length || 0;

      // Fetch high-risk students' latest screenings
      const { data: highRiskScreenings } = await supabase
        .from('screening_responses')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .eq('risk_level', 'high')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalBookings: bookings?.length || 0,
        todayBookings,
        pendingBookings,
        completedSessions
      });

      setMyBookings(bookings || []);
      setHighRiskStudents(highRiskScreenings || []);
      
    } catch (error) {
      console.error('Error fetching counselor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      // First get the counselor profile ID to verify ownership
      const { data: counselorProfile } = await supabase
        .from('counselor_profiles')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      if (!counselorProfile) {
        console.error('No counselor profile found');
        return;
      }

      const { error } = await supabase
        .from('counselor_bookings')
        .update({ status })
        .eq('id', bookingId)
        .eq('counselor_id', counselorProfile.id); // Ensure counselor can only update their own bookings

      if (!error) {
        fetchCounselorData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Counselor Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back, Dr. {profile?.full_name}. Here's your session and student overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                All-time bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayBookings}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingBookings}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedSessions}</div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">My Sessions</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="high-risk">High-Risk Students</TabsTrigger>
            <TabsTrigger value="analytics">Session Analytics</TabsTrigger>
            <TabsTrigger value="resources">Resource Management</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Upcoming & Recent Sessions</span>
                </CardTitle>
                <CardDescription>
                  Manage your counseling appointments and session statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myBookings.map((booking, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">
                          Session with {booking.student?.full_name || 'Student'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.appointment_date).toLocaleDateString()} at{' '}
                          {new Date(booking.appointment_date).toLocaleTimeString()}
                        </p>
                        {booking.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Note: {booking.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(booking.status)}
                        {booking.status === 'pending' && (
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {myBookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sessions scheduled yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <CounselorAvailabilityManager />
          </TabsContent>

          <TabsContent value="high-risk">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>High-Risk Students</span>
                </CardTitle>
                <CardDescription>
                  Students with recent high-risk screening results who may need immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {highRiskStudents.map((screening, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {screening.profiles.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {screening.screening_type === 'phq9' ? 'Depression' : 'Anxiety'} Screening - 
                          Score: {screening.total_score} | {new Date(screening.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRiskBadge(screening.risk_level)}
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Contact Student
                        </Button>
                      </div>
                    </div>
                  ))}

                  {highRiskStudents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                      <p>No high-risk students at the moment</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Session Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Sessions</span>
                      <span className="font-medium">{stats.totalBookings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed Sessions</span>
                      <span className="font-medium">{stats.completedSessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Success Rate</span>
                      <span className="font-medium">
                        {stats.totalBookings > 0 
                          ? Math.round((stats.completedSessions / stats.totalBookings) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Approvals</span>
                      <span className="font-medium">{stats.pendingBookings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>Student Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>High-Risk Students</span>
                      <span className="font-medium text-red-600">{highRiskStudents.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Students Helped</span>
                      <span className="font-medium">{stats.completedSessions}</span>
                    </div>
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Your dedication makes a difference in students' lives
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <AdminResourceManagement />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex-col space-y-2">
              <Clock className="h-6 w-6" />
              <span>Set Availability</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <MessageSquare className="h-6 w-6" />
              <span>Student Messages</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>View All Students</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounselorDashboard;