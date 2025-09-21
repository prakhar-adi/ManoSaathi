import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Brain,
  BookOpen,
  MessageSquare,
  Shield,
  Activity
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminResourceManagement from '@/components/AdminResourceManagement';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    studentsCount: 0,
    counselorsCount: 0,
    totalScreenings: 0,
    highRiskUsers: 0,
    totalBookings: 0,
    totalResources: 0,
    todayBookings: 0
  });
  const [recentScreenings, setRecentScreenings] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      // Fetch user counts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');
      
      const studentsCount = profiles?.filter(p => p.role === 'student').length || 0;
      const counselorsCount = profiles?.filter(p => p.role === 'counselor').length || 0;

      // Fetch screening stats
      const { data: screenings } = await supabase
        .from('screening_responses')
        .select('risk_level, created_at');
      
      const highRiskUsers = screenings?.filter(s => s.risk_level === 'high').length || 0;

      // Fetch booking stats
      const { data: bookings } = await supabase
        .from('counselor_bookings')
        .select('appointment_date, status');
      
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookings?.filter(b => 
        b.appointment_date.startsWith(today)
      ).length || 0;

      // Fetch resources count
      const { data: resources } = await supabase
        .from('resources')
        .select('id');

      // Fetch recent screenings
      const { data: recentScreeningsData } = await supabase
        .from('screening_responses')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent bookings
      const { data: recentBookingsData } = await supabase
        .from('counselor_bookings')
        .select(`
          *,
          student:student_id(full_name, email),
          counselor:counselor_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalUsers: profiles?.length || 0,
        studentsCount,
        counselorsCount,
        totalScreenings: screenings?.length || 0,
        highRiskUsers,
        totalBookings: bookings?.length || 0,
        totalResources: resources?.length || 0,
        todayBookings
      });

      setRecentScreenings(recentScreeningsData || []);
      setRecentBookings(recentBookingsData || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Moderate Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      default:
        return null;
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
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {profile?.full_name}. Here's your ManoSaathi platform overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.studentsCount} students, {stats.counselorsCount} counselors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Screenings</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScreenings}</div>
              <p className="text-xs text-red-600">
                {stats.highRiskUsers} high-risk cases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Counseling Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.todayBookings} scheduled today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resources Available</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResources}</div>
              <p className="text-xs text-muted-foreground">
                Multi-language content
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="screenings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="screenings">Recent Screenings</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resources">Resource Management</TabsTrigger>
          </TabsList>

          <TabsContent value="screenings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Recent Mental Health Screenings</span>
                </CardTitle>
                <CardDescription>
                  Latest screening results from students (anonymized view)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentScreenings.map((screening, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {screening.screening_type === 'phq9' ? 'Depression' : 'Anxiety'} Screening
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Score: {screening.total_score} | {new Date(screening.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRiskBadge(screening.risk_level)}
                        {screening.risk_level === 'high' && (
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Follow Up
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Recent Counseling Bookings</span>
                </CardTitle>
                <CardDescription>
                  Latest appointment requests and sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.map((booking, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">
                          Session on {new Date(booking.appointment_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Counselor: {booking.counselor?.full_name || 'Not assigned'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(booking.status)}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
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
                    <span>Risk Level Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>High Risk</span>
                        <span className="font-medium text-red-600">{stats.highRiskUsers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(stats.highRiskUsers / stats.totalScreenings) * 100 || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Screenings</span>
                        <span className="font-medium">{stats.totalScreenings}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Platform Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Active Students</span>
                      <span className="font-medium">{stats.studentsCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Available Counselors</span>
                      <span className="font-medium">{stats.counselorsCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Resources Published</span>
                      <span className="font-medium">{stats.totalResources}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sessions Today</span>
                      <span className="font-medium">{stats.todayBookings}</span>
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
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BookOpen className="h-6 w-6" />
              <span>Manage Resources</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>Generate Reports</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;