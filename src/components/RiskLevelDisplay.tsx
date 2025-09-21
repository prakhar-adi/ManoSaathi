import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle, Heart, BookOpen, MessageSquare } from "lucide-react";
import { Link } from 'react-router-dom';

interface RiskLevelDisplayProps {
  riskLevel: 'low' | 'medium' | 'high';
  score: number;
  screeningType: 'phq9' | 'gad7';
  onRetakeScreening: () => void;
}

const RiskLevelDisplay: React.FC<RiskLevelDisplayProps> = ({ 
  riskLevel, 
  score, 
  screeningType, 
  onRetakeScreening 
}) => {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'low':
        return {
          icon: CheckCircle,
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          title: 'Low Risk',
          description: 'Your screening indicates minimal symptoms. Keep up the good work!',
          recommendations: [
            'Continue with healthy lifestyle habits',
            'Practice regular mindfulness and self-care',
            'Stay connected with friends and family',
            'Maintain regular exercise and sleep schedule'
          ]
        };
      case 'medium':
        return {
          icon: AlertCircle,
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          title: 'Moderate Risk',
          description: 'Your screening indicates moderate symptoms that may benefit from support.',
          recommendations: [
            'Consider speaking with a counselor',
            'Explore our mental health resources',
            'Practice stress management techniques',
            'Monitor your symptoms and seek help if they worsen'
          ]
        };
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          title: 'High Risk',
          description: 'Your screening indicates significant symptoms. We strongly recommend seeking professional support.',
          recommendations: [
            'Schedule an appointment with a counselor immediately',
            'Consider contacting emergency services if you have thoughts of self-harm',
            'Reach out to trusted friends or family members',
            'Use our crisis chat feature for immediate support'
          ]
        };
    }
  };

  const config = getRiskConfig();
  const Icon = config.icon;
  const maxScore = screeningType === 'phq9' ? 27 : 21;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className={`w-16 h-16 rounded-full ${config.color} flex items-center justify-center mx-auto mb-4`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">
            Screening Results
          </CardTitle>
          <CardDescription>
            {screeningType === 'phq9' ? 'Depression Screening (PHQ-9)' : 'Anxiety Screening (GAD-7)'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="secondary" className={`${config.textColor} ${config.bgColor} px-4 py-2 text-lg`}>
              {config.title}
            </Badge>
            <p className="text-3xl font-bold">
              {score} / {maxScore}
            </p>
            <p className="text-muted-foreground">
              {config.description}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recommended Next Steps:</h3>
            <ul className="space-y-2">
              {config.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {riskLevel === 'high' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">Immediate Support Available</h4>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  If you're having thoughts of self-harm or suicide, please reach out immediately:
                </p>
                <div className="space-y-2">
                  <Button variant="destructive" className="w-full">
                    Emergency Helpline: 1950
                  </Button>
                  <Link to="/chat">
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Crisis Chat Support
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onRetakeScreening} variant="outline" className="flex-1">
              Retake Screening
            </Button>
            <Link to="/resources" className="flex-1">
              <Button className="w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                View Resources
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              This screening is for informational purposes only and does not replace professional medical advice.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskLevelDisplay;