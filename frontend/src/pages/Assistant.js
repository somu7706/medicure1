import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Send, Mic, MicOff, Volume2, Loader2, Bot, User, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Assistant = () => {
  const { t, i18n } = useTranslation();
  const { api, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Load chat history
    const fetchHistory = async () => {
      try {
        const response = await api.get('/chat/history');
        const history = response.data.items || [];
        const formattedHistory = history.flatMap(item => [
          { role: 'user', content: item.message },
          { role: 'assistant', content: item.response }
        ]);
        setMessages(formattedHistory);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    fetchHistory();
  }, [api]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/chat', { message: userMessage });
      const assistantMessage = response.data.data.response;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to get response';
      toast.error(errorMessage);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('common.error')
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (messages.length === 0) return;

    if (window.confirm('Are you sure you want to clear the entire chat history? This cannot be undone.')) {
      try {
        await api.delete('/chat/history');
        setMessages([]);
        toast.success('Chat history cleared');
      } catch (err) {
        console.error('Failed to clear chat:', err);
        toast.error('Failed to clear chat history');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.info(t('assistant.listening'));
    } catch (err) {
      console.error('Recording error:', err);
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await api.post('/voice/stt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const transcribedText = response.data.data.text;
      if (transcribedText) {
        setInput(transcribedText);
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Transcription error:', err);
      toast.error('Speech recognition failed');
    }
  };

  const playTTS = async (text) => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      const response = await api.post('/voice/tts', {
        text: text.substring(0, 500), // Limit text length
        lang: i18n.language
      }, { responseType: 'blob' });

      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        toast.error('Audio playback failed');
      };
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsPlaying(false);
      toast.error('Text-to-speech failed');
    }
  };

  const formatMessage = (content) => {
    // Basic markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={i} className="ml-4">{line.substring(2)}</li>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
        }
        return <p key={i}>{line}</p>;
      });
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)]" data-testid="assistant-page">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('assistant.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('assistant.subtitle')}</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="text-muted-foreground hover:text-destructive hover:border-destructive transition-colors rounded-full px-4"
            data-testid="clear-chat-btn"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Container */}
      <Card className="glass-panel border-border/50 h-full flex flex-col">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Hello, {user?.name ? user.name.split(' ')[0] : 'User'}! 👋
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t('assistant.medicalOnly')}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['What causes headaches?', 'Diabetes symptoms', 'Blood pressure tips'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                      }`}
                  >
                    <div className="text-sm space-y-1">
                      {formatMessage(message.content)}
                    </div>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => playTTS(message.content)}
                        disabled={isPlaying}
                        className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        data-testid={`tts-${index}`}
                      >
                        <Volume2 className="h-3 w-3" />
                        {isPlaying ? 'Playing...' : 'Listen'}
                      </button>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Disclaimer */}
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-3 w-3" />
            {t('assistant.disclaimer')}
          </div>
        </div>

        {/* Input Area */}
        <CardContent className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            {/* Voice Input Button */}
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              className="flex-shrink-0"
              data-testid="voice-btn"
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Text Input */}
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('assistant.placeholder')}
              className="flex-1 h-12"
              disabled={loading}
              data-testid="chat-input"
            />

            {/* Send Button */}
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 h-12 px-6 rounded-full"
              data-testid="send-btn"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assistant;
