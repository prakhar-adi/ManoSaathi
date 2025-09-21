import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MessageSquare, 
  BookOpen, 
  Users, 
  Shield, 
  Globe,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import chatbotIcon from '@/assets/chatbot-icon.png';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "AI Mental Health Support",
      description: "24/7 confidential AI counselor available in English, Hindi, and Urdu",
      color: "text-blue-600"
    },
    {
      icon: Users,
      title: "Peer Support Community",
      description: "Connect with fellow students in a safe, moderated environment",
      color: "text-green-600"
    },
    {
      icon: BookOpen,
      title: "Mental Health Resources",
      description: "Access curated guides, articles, and self-help materials",
      color: "text-purple-600"
    },
    {
      icon: Shield,
      title: "Professional Counseling",
      description: "Book sessions with qualified mental health professionals",
      color: "text-orange-600"
    }
  ];

  const benefits = [
    "Confidential and secure",
    "Available 24/7",
    "Multi-language support",
    "Culturally sensitive",
    "Free to use",
    "Professional backup"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-therapeutic-calm to-accent">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <img src={chatbotIcon} alt="ManoSaathi" className="w-16 h-16 mr-4" />
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Welcome to ManoSaathi
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Your trusted companion for mental wellness. Get confidential support, 
            connect with peers, and access professional help - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/peer-support">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Try Peer Support
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full bg-muted ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Why Choose ManoSaathi?
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Multi-Language Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇬🇧</span>
                <span>English - Full support</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇮🇳</span>
                <span>हिंदी - Complete support</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇵🇰</span>
                <span>اردو - Full support</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-primary/10 border-primary/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Ready to Start Your Mental Wellness Journey?
              </h3>
              <p className="text-muted-foreground mb-6">
                Join thousands of students who have found support and community through ManoSaathi.
              </p>
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Create Your Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            ManoSaathi - Your Mental Health Companion
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            In case of crisis, call KIRAN Helpline: 1800-599-0019 (24/7)
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
