import React, { useMemo, useRef, useState } from 'react';
import { getGeminiModel } from '@/integrations/gemini/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import chatbotIcon from '@/assets/chatbot-icon.png';

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const model = useMemo(() => {
    try {
      return getGeminiModel('gemini-1.5-flash');
    } catch (e) {
      return null;
    }
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !model) return;
    const userMsg: ChatMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
      const result = await model.generateContent({ contents: [...history, { role: 'user', parts: [{ text: trimmed }] }] });
      const text = result.response.text();
      setMessages((prev) => [...prev, { role: 'model', text }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'model', text: 'Sorry, I ran into an error. Please try again.' }]);
      // Optionally log err
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 0);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-primary text-primary-foreground w-14 h-14 flex items-center justify-center hover:opacity-90"
        aria-label="Open AI Chatbot"
      >
        <img src={chatbotIcon} alt="Chatbot" className="w-8 h-8" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96">
          <Card className="bg-card/95 backdrop-blur p-3 shadow-xl border">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">AI Support</div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
            <div ref={scrollRef} className="h-80 overflow-y-auto pr-1 space-y-3 border rounded-md p-3 bg-background">
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Ask me anything about the app or mental wellness. I’m here to help.
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={
                    'inline-block rounded-md px-3 py-2 text-sm ' +
                    (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')
                  }>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left">
                  <div className="inline-block rounded-md px-3 py-2 text-sm bg-muted text-foreground opacity-80">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>Send</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;


