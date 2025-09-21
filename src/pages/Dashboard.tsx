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
  Globe
} from "lucide-react";
import heroImage from "@/assets/hero-mental-health.jpg";

const Dashboard = () => {
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
                  Mental Health Support for J&K Students
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  Your Mental Health Matters
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Confidential, culturally-sensitive mental health support designed specifically for 
                  students in Jammu and Kashmir. Available 24/7 in your preferred language.
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

      {/* Quick Actions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Get Support Your Way
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from multiple support options designed to meet you where you are, 
              whether you need immediate help or ongoing resources.
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

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose MindCare J&K?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform is specifically designed for the unique needs and cultural context 
              of students in the Jammu and Kashmir region.
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

export default Dashboard;