import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// PHQ-9 Questions
const phq9Questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed, or the opposite being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself"
];

// GAD-7 Questions
const gad7Questions = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen"
];

interface ScreeningQuestionnaireProps {
  type: 'phq9' | 'gad7';
  onComplete: (result: { score: number; riskLevel: 'low' | 'medium' | 'high' }) => void;
  onClose: () => void;
}

const ScreeningQuestionnaire: React.FC<ScreeningQuestionnaireProps> = ({ type, onComplete, onClose }) => {
  const questions = type === 'phq9' ? phq9Questions : gad7Questions;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<number[]>(new Array(questions.length).fill(-1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const options = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
  ];

  const handleResponseChange = (value: string) => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = parseInt(value);
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateRiskLevel = (totalScore: number, screeningType: 'phq9' | 'gad7'): 'low' | 'medium' | 'high' => {
    if (screeningType === 'phq9') {
      if (totalScore <= 4) return 'low';
      if (totalScore <= 14) return 'medium';
      return 'high';
    } else { // gad7
      if (totalScore <= 4) return 'low';
      if (totalScore <= 9) return 'medium';
      return 'high';
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const totalScore = responses.reduce((sum, response) => sum + response, 0);
    const riskLevel = calculateRiskLevel(totalScore, type);

    try {
      if (user) {
        const { error } = await supabase
          .from('screening_responses')
          .insert({
            user_id: user.id,
            screening_type: type,
            responses: responses,
            total_score: totalScore,
            risk_level: riskLevel
          });

        if (error) {
          console.error('Error saving screening response:', error);
          toast({
            title: "Error",
            description: "Failed to save screening results. Please try again.",
            variant: "destructive"
          });
        }
      }

      onComplete({ score: totalScore, riskLevel });
    } catch (error) {
      console.error('Error submitting screening:', error);
      toast({
        title: "Error",
        description: "Failed to submit screening. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isCurrentQuestionAnswered = responses[currentQuestion] !== -1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {type === 'phq9' ? 'Depression Screening (PHQ-9)' : 'Anxiety Screening (GAD-7)'}
            </span>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </CardTitle>
          <CardDescription>
            Question {currentQuestion + 1} of {questions.length}
          </CardDescription>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Over the last 2 weeks, how often have you been bothered by:
            </h3>
            <p className="text-xl font-semibold text-foreground">
              {questions[currentQuestion]}
            </p>
          </div>

          <RadioGroup
            value={responses[currentQuestion].toString()}
            onValueChange={handleResponseChange}
            className="space-y-3"
          >
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered || isSubmitting}
            >
              {currentQuestion === questions.length - 1 
                ? (isSubmitting ? "Submitting..." : "Submit") 
                : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreeningQuestionnaire;