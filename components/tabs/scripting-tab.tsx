"use client";

import { useState, useEffect, useRef } from 'react';
import { Project } from '../dashboard';
import { useToast } from '@/lib/toast-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { 
  Save, 
  Sparkles, 
  Send, 
  Bot,
  User,
  Trash2,
  X,
  MessageSquare
} from 'lucide-react';

// Gemini API key (provided by user)
const GEMINI_API_KEY = 'AIzaSyDfCgfe_qTrf16dBjOUuMQRzSGjmXyZ-YI';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ScriptingTabProps {
  project: Project;
}

export function ScriptingTab({ project }: ScriptingTabProps) {
  const { showToast } = useToast();
  const [script, setScript] = useState(project.script || '');
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(async () => {
      if (script !== project.script) {
        await handleSave(true);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  const handleSave = async (isAutoSave = false) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'projects', project.id), {
        script: script,
        updatedAt: serverTimestamp(),
      });
      if (!isAutoSave) {
        showToast('Script saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      showToast('Failed to save script', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendToGemini = async (message: string) => {
    setChatLoading(true);
    setChatMessages((prev) => [...prev, { role: 'user', content: message }]);
    setChatInput('');

    try {
      // System context for the AI
      const systemPrompt = `You are a professional Video Script Consultant. Your role is to help content creators write engaging, well-structured video scripts. You provide advice on:
- Script structure and pacing
- Hook writing and viewer retention
- Call-to-actions
- Storytelling techniques
- SEO-friendly titles and descriptions
- Audience engagement strategies

Current script context:
${script || 'No script written yet.'}

Be concise, helpful, and provide actionable suggestions.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt + '\n\nUser question: ' + message }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        'Sorry, I could not generate a response.';

      setChatMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Gemini API error:', error);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
      showToast('AI response failed', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !chatLoading) {
      sendToGemini(chatInput.trim());
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const charCount = script.length;

  return (
    <div className="flex h-[calc(100vh-220px)] gap-4">
      {/* Script Editor */}
      <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
        {/* Editor Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-foreground">Script Editor</h2>
            <span className="text-xs text-muted-foreground">
              {wordCount} words · {charCount} characters
            </span>
            {saving && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Spinner className="h-3 w-3" />
                Saving...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className={showChat ? 'bg-primary/10 text-primary' : ''}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Assistant
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="bg-primary text-primary-foreground"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Editor Body */}
        <textarea
          ref={textareaRef}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Start writing your video script here...

Tips:
• Start with a strong hook (first 5 seconds are crucial)
• Structure: Hook → Problem → Solution → CTA
• Keep paragraphs short for better pacing
• Add [B-ROLL] markers for visual transitions"
          className="flex-1 resize-none bg-transparent p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {/* AI Chat Sidebar */}
      {showChat && (
        <div className="w-96 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Script Consultant</h3>
                <p className="text-xs text-muted-foreground">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowChat(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Ask me anything about your script!
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    'How can I improve my hook?',
                    'Suggest a call-to-action',
                    'Review my script structure',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendToGemini(suggestion)}
                      className="block w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <User className="h-4 w-4 text-foreground" />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg bg-secondary px-4 py-3">
                  <Spinner className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your script..."
                className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                disabled={chatLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!chatInput.trim() || chatLoading}
                className="bg-primary text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
