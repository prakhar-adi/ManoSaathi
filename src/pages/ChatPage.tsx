import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Bot, 
  User, 
  Shield, 
  Globe, 
  AlertTriangle,
  Heart
} from "lucide-react";
import chatbotIcon from "@/assets/chatbot-icon.png";
import { getGeminiModel } from "@/integrations/gemini/client";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      content: "नमस्ते! Hello! السلام علیکم! I'm your AI mental health support assistant. I'm here to listen and help you through whatever you're facing. How are you feeling today?",
      timestamp: new Date(),
      isMultiLang: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const model = useMemo(() => {
    try {
      return getGeminiModel('gemini-1.5-flash');
    } catch (e) {
      return null;
    }
  }, []);

  const suggestedResponses = [
    "I'm feeling anxious about exams",
    "I'm struggling with homesickness", 
    "I need help with stress management",
    "I'm having trouble sleeping",
    "मुझे बात करनी है (I want to talk)"
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !model) return;

    const newMessage = {
      id: messages.length + 1,
      sender: "user",
      content: inputMessage,
      timestamp: new Date(),
      isMultiLang: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Create context-aware prompt for mental health support
      const systemPrompt = `You are a compassionate AI mental health support assistant for Indian college students. 
      Respond in a culturally sensitive, supportive manner. The user is speaking in ${selectedLanguage}.
      
      Guidelines:
      - Be empathetic and non-judgmental
      - Provide practical coping strategies
      - Encourage professional help when needed
      - Use appropriate language for the user's preferred language
      - Focus on mental wellness and emotional support
      - If crisis indicators are mentioned, gently suggest professional resources
      
      Respond in the same language as the user's message, or in English if mixed.`;

      const chatHistory = messages.slice(-5).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...chatHistory,
          { role: 'user', parts: [{ text: inputMessage }] }
        ]
      });

      const aiResponse = {
        id: messages.length + 2,
        sender: "bot",
        content: result.response.text(),
        timestamp: new Date(),
        isMultiLang: false
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse = {
        id: messages.length + 2,
        sender: "bot",
        content: "I'm sorry, I'm having trouble responding right now. Please try again, or if you need immediate support, please contact the KIRAN helpline at 1800-599-0019.",
        timestamp: new Date(),
        isMultiLang: false
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedResponse = (response: string) => {
    setInputMessage(response);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img src={chatbotIcon} alt="AI Counselor" className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Mental Health Support</h1>
                <p className="text-muted-foreground">Confidential • Available 24/7 • Multi-language</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Secure
            </Badge>
          </div>

          {/* Privacy Notice */}
          <Card className="bg-primary-soft/20 border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Your privacy is protected</p>
                  <p className="text-xs text-muted-foreground">
                    This conversation is encrypted and confidential. Our AI is trained to provide culturally 
                    sensitive support and will alert human counselors only in crisis situations with your consent.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Chat */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AI Counselor
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Multi-language
                    </Badge>
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.sender === "bot" && (
                          <Bot className="h-4 w-4 mt-1 text-primary" />
                        )}
                        {message.sender === "user" && (
                          <User className="h-4 w-4 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          {message.isMultiLang && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              Multi-language greeting
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                      <div className="flex items-start gap-2">
                        <Bot className="h-4 w-4 mt-1 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">AI is thinking...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex-shrink-0 border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message here... आप हिंदी में भी लिख सकते हैं"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading || !model}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Responses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedResponses.map((response, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSuggestedResponse(response)}
                  >
                    {response}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Crisis Support */}
            <Card className="border-warning bg-warning/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Crisis Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  If you're having thoughts of self-harm or suicide, please reach out immediately.
                </p>
                <Button variant="destructive" className="w-full">
                  <Heart className="h-4 w-4 mr-2" />
                  Emergency: 1950
                </Button>
                <Button variant="outline" className="w-full">
                  Connect to Counselor
                </Button>
              </CardContent>
            </Card>

            {/* Language Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Language / भाषा</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant={selectedLanguage === 'english' ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setSelectedLanguage('english')}
                >
                  🇬🇧 English
                </Button>
                <Button 
                  variant={selectedLanguage === 'hindi' ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setSelectedLanguage('hindi')}
                >
                  🇮🇳 हिंदी (Hindi)
                </Button>
                <Button 
                  variant={selectedLanguage === 'urdu' ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setSelectedLanguage('urdu')}
                >
                  🇵🇰 اردو (Urdu)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;