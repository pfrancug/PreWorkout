import type { IRow } from '../types/types';

import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { ScrollArea } from '@components/ui/scroll-area';
import { Textarea } from '@components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@components/ui/tooltip';
import { GoogleGenAI } from '@google/genai';
import { cn } from '@lib/utils';
import { Bot, Database, Send, Trash2, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Streamdown } from 'streamdown';

import { CHAT_ROLES } from '../constants/storage';
import { useAuth } from '../contexts/useAuth';
import { useSettings } from '../contexts/useSettings';
import {
  clearUserMessages,
  saveUserMessages,
  subscribeToUserMessages,
} from '../firebase/database';

const LoadingDots = () => (
  <div className={'flex items-center gap-1 py-1'}>
    <span
      className={
        'h-2 w-2 animate-pulse rounded-full bg-sidebar-foreground/40 [animation-delay:-0.3s]'
      }
    />

    <span
      className={
        'h-2 w-2 animate-pulse rounded-full bg-sidebar-foreground/40 [animation-delay:-0.15s]'
      }
    />

    <span
      className={'h-2 w-2 animate-pulse rounded-full bg-sidebar-foreground/40'}
    />
  </div>
);

interface Props {
  dataset: IRow[] | null;
  onClose?: () => void;
}

export interface Message {
  attachedDataset?: IRow[];
  parts: { text: string }[];
  role: string;
}

export const Chat = ({ dataset, onClose }: Props) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { user } = useAuth();
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY ?? null;

  if (!apiKey) {
    throw new Error(
      'API key is not set. Please set VITE_GEMINI_API_KEY in your environment variables.',
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: 'instant' | 'smooth' = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  const [input, setInput] = useState('');
  const [isAttached, setIsAttached] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize with welcome message on first render
  useEffect(() => {
    setMessages([
      {
        role: CHAT_ROLES.MODEL,
        parts: [{ text: t('chat.welcomeMessage') }],
      },
    ]);
  }, [t]);

  // Subscribe to messages from Firebase for logged-in user (load only)
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToUserMessages(
      user.uid,
      (firebaseMessages) => {
        if (firebaseMessages.length > 0) {
          setMessages(firebaseMessages);
        }
        setTimeout(() => scrollToBottom('instant'), 0);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async () => {
    const trimmedText = input.trim();
    const newUserMessage: Message = {
      role: CHAT_ROLES.USER,
      parts: [{ text: trimmedText }],
      attachedDataset: isAttached && dataset ? [...dataset] : undefined,
    };

    setInput('');
    setIsAttached(false);

    const messagesWithUser = [...messages, newUserMessage];
    setMessages(messagesWithUser);

    const messagesWithDataset: Message = {
      role: newUserMessage.role,
      parts: [
        {
          text:
            newUserMessage.parts[0].text +
            (newUserMessage.attachedDataset
              ? `\n\n${JSON.stringify(newUserMessage.attachedDataset)}`
              : ''),
        },
      ],
    };

    // Add empty model message for streaming
    const emptyModelMessage: Message = {
      role: 'model',
      parts: [{ text: '' }],
    };
    setMessages((prev) => [...prev, emptyModelMessage]);
    setIsStreaming(true);

    let finalMessages: Message[] = [
      ...messages,
      newUserMessage,
      emptyModelMessage,
    ];

    try {
      // Build system instruction with user settings
      const userInfo = [];
      if (settings.name) {
        userInfo.push(`Name: ${settings.name}`);
      }
      if (settings.age) {
        userInfo.push(`Age: ${settings.age}`);
      }
      if (settings.height) {
        userInfo.push(`Height: ${settings.height}cm`);
      }

      const systemInstruction =
        userInfo.length > 0
          ? `You are a helpful fitness and nutrition assistant. The user's profile: ${userInfo.join(', ')}. Use this information to provide personalized advice.`
          : 'You are a helpful fitness and nutrition assistant.';

      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction,
        },
        contents: [...messages, messagesWithDataset],
      });

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk.text ?? '';
        const modelMessage: Message = {
          role: 'model',
          parts: [{ text: fullText }],
        };
        finalMessages = [...messages, newUserMessage, modelMessage];
        setMessages(finalMessages);
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      const errorMessage: Message = {
        role: 'model',
        parts: [{ text: t('chat.errorGenerating') }],
      };
      finalMessages = [...messages, newUserMessage, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsStreaming(false);
      // Save to Firebase after streaming completes
      if (user && finalMessages.length > 1) {
        await saveUserMessages(user.uid, finalMessages);
      }
      scrollToBottom();
    }
  };

  return (
    <div
      className={
        'flex h-full w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground'
      }
    >
      {/* Header */}
      <header
        className={'flex h-12 shrink-0 items-center justify-between px-4'}
      >
        <div className={'flex items-center gap-2'}>
          <Bot className={'h-4 w-4 text-sidebar-foreground/70'} />

          <span className={'text-sm font-medium'}>{t('chat.title')}</span>
        </div>

        <div className={'flex items-center gap-1'}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={'h-7 w-7'}
                  size={'icon'}
                  variant={'ghost'}
                  onClick={() => {
                    setMessages((prev) => [prev[0]]);
                    if (user) {
                      clearUserMessages(user.uid);
                    }
                  }}
                >
                  <Trash2 className={'h-4 w-4'} />
                </Button>
              </TooltipTrigger>

              <TooltipContent>{t('chat.clearChat')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {onClose && (
            <Button
              className={'h-7 w-7'}
              onClick={onClose}
              size={'icon'}
              variant={'ghost'}
            >
              <X className={'h-4 w-4'} />
            </Button>
          )}
        </div>
      </header>

      {/* Messages */}
      <ScrollArea
        viewportRef={scrollRef}
        className={
          'min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-32px),transparent_100%)]'
        }
      >
        <div className={'space-y-4 p-4'}>
          {messages.map((message, index) => {
            const isUser = message.role === CHAT_ROLES.USER;
            const isLastMessage = index === messages.length - 1;
            const isCurrentlyStreaming =
              isStreaming && isLastMessage && !isUser;

            return (
              <div
                className={cn('flex gap-3', isUser && 'flex-row-reverse')}
                key={index}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    isUser ? 'bg-sidebar-primary' : 'bg-sidebar-accent',
                  )}
                >
                  {isUser ? (
                    <User
                      className={'h-4 w-4 text-sidebar-primary-foreground'}
                    />
                  ) : (
                    <Bot className={'h-4 w-4 text-sidebar-accent-foreground'} />
                  )}
                </div>

                <div
                  className={cn(
                    'flex max-w-[75%] flex-col gap-1',
                    isUser && 'items-end',
                  )}
                >
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm',
                      isUser
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'bg-sidebar-accent text-sidebar-accent-foreground',
                    )}
                  >
                    {isUser ? (
                      message.parts[0].text
                    ) : isCurrentlyStreaming && !message.parts[0].text ? (
                      <LoadingDots />
                    ) : (
                      <div
                        className={
                          'prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'
                        }
                      >
                        <Streamdown
                          caret={isCurrentlyStreaming ? 'block' : undefined}
                          isAnimating={isCurrentlyStreaming}
                          mode={isCurrentlyStreaming ? 'streaming' : 'static'}
                        >
                          {message.parts[0].text}
                        </Streamdown>
                      </div>
                    )}
                  </div>

                  {message.attachedDataset && (
                    <div
                      className={
                        'flex items-center gap-1 text-xs text-sidebar-foreground/60'
                      }
                    >
                      <Database className={'h-3 w-3'} />

                      <span>{t('chat.dataAttached')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className={'shrink-0 p-4'}>
        <div className={'flex items-end gap-2'}>
          <Textarea
            placeholder={t('chat.placeholder')}
            rows={1}
            value={input}
            className={
              'min-h-[40px] flex-1 resize-none border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground placeholder:text-sidebar-foreground/50'
            }
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (
                input.trim() &&
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isStreaming
              ) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          <Button
            disabled={!input.trim() || isStreaming}
            onClick={handleSubmit}
            size={'icon'}
            className={
              'h-[40px] w-[40px] bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
            }
          >
            <Send className={'h-4 w-4'} />
          </Button>
        </div>

        <div className={'mt-2 flex items-center gap-2'}>
          <Checkbox
            checked={isAttached}
            disabled={!dataset}
            id={'attach-data'}
            onCheckedChange={(checked) => setIsAttached(checked === true)}
          />

          <label
            className={'text-xs text-sidebar-foreground/60'}
            htmlFor={'attach-data'}
          >
            {t('chat.attachDataset')}
          </label>
        </div>
      </div>
    </div>
  );
};
