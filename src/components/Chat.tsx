import type { IRow } from '../types/types';

import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Button } from '@components/ui/button';
import { ScrollArea } from '@components/ui/scroll-area';
import { Textarea } from '@components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@components/ui/tooltip';
import { cn } from '@lib/utils';
import { Bot, Database, Send, Settings, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Streamdown } from 'streamdown';

import { CHAT_ROLES } from '../constants/storage';
import { useAuth } from '../contexts/useAuth';
import { useSettings } from '../contexts/useSettings';
import {
  clearUserMessages,
  saveUserMessages,
  subscribeToUserMessages,
} from '../firebase/database';
import {
  isGeminiAvailable,
  isGrokAvailable,
  isRateLimitError,
  streamFromGemini,
  streamFromGrok,
} from '../lib/ai';

type AIProvider = 'gemini' | 'grok';

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
  variant?: 'drawer' | 'page';
}

export interface Message {
  attachedDataset?: IRow[];
  parts: { text: string }[];
  role: string;
}

export const Chat = ({ dataset, variant = 'drawer' }: Props) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isPage = variant === 'page';

  const hasAllSettings = !!(
    settings.name &&
    settings.age &&
    settings.height &&
    settings.sex
  );
  const showSettingsAlert = !hasAllSettings;

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
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');

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

    const userMessageContent =
      newUserMessage.parts[0].text +
      (newUserMessage.attachedDataset
        ? `\n\n${JSON.stringify(newUserMessage.attachedDataset)}`
        : '');

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

    // Convert messages to AI format
    const aiMessages = messages.map((m) => ({
      role: (m.role === 'model' ? 'assistant' : 'user') as
        | 'user'
        | 'assistant'
        | 'system',
      content: m.parts[0].text,
    }));

    const aiConfig = {
      systemInstruction,
      messages: aiMessages,
      userMessage: userMessageContent,
    };

    const callbacks = {
      onChunk: (text: string) => {
        const modelMessage: Message = {
          role: 'model',
          parts: [{ text }],
        };
        finalMessages = [...messages, newUserMessage, modelMessage];
        setMessages(finalMessages);
      },
      onComplete: () => {
        // Handled in finally block
      },
      onError: (error: Error) => {
        console.error('AI error:', error);
      },
    };

    try {
      if (aiProvider === 'grok' && isGrokAvailable()) {
        await streamFromGrok(aiConfig, callbacks);
      } else if (isGeminiAvailable()) {
        await streamFromGemini(aiConfig, callbacks);
      } else {
        throw new Error('No AI provider available');
      }
    } catch (error) {
      // If primary provider fails with rate limit, try fallback
      if (isRateLimitError(error)) {
        console.log(`${aiProvider} rate limited, trying fallback...`);
        // Switch to the fallback provider
        if (aiProvider === 'gemini' && isGrokAvailable()) {
          setAiProvider('grok');
        } else if (aiProvider === 'grok' && isGeminiAvailable()) {
          setAiProvider('gemini');
        }
        try {
          if (aiProvider === 'gemini' && isGrokAvailable()) {
            await streamFromGrok(aiConfig, callbacks);
          } else if (aiProvider === 'grok' && isGeminiAvailable()) {
            await streamFromGemini(aiConfig, callbacks);
          } else {
            throw error;
          }
        } catch (fallbackError) {
          console.error('Fallback API error:', fallbackError);
          const errorMessage: Message = {
            role: 'model',
            parts: [{ text: t('chat.errorGenerating') }],
          };
          finalMessages = [...messages, newUserMessage, errorMessage];
          setMessages(finalMessages);
        }
      } else {
        console.error('API error:', error);
        const errorMessage: Message = {
          role: 'model',
          parts: [{ text: t('chat.errorGenerating') }],
        };
        finalMessages = [...messages, newUserMessage, errorMessage];
        setMessages(finalMessages);
      }
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
      className={cn(
        'flex h-full w-full flex-col overflow-hidden',
        isPage
          ? 'bg-background text-foreground'
          : 'bg-sidebar text-sidebar-foreground',
      )}
    >
      {/* Header */}
      <header
        className={'flex h-12 shrink-0 items-center justify-between px-4'}
      >
        <div className={'flex items-center gap-2'}>
          <Bot
            className={cn(
              'h-4 w-4',
              isPage ? 'text-muted-foreground' : 'text-sidebar-foreground/70',
            )}
          />

          <span className={'text-sm font-medium'}>{t('chat.title')}</span>
        </div>

        <div className={'flex items-center gap-2'}>
          <Button
            className={'h-7 px-2 text-xs'}
            disabled={!isGeminiAvailable() || showSettingsAlert}
            onClick={() => setAiProvider('gemini')}
            size={'sm'}
            variant={aiProvider === 'gemini' ? 'default' : 'ghost'}
          >
            {'Gemini'}
          </Button>
          <Button
            className={'h-7 px-2 text-xs'}
            disabled={!isGrokAvailable() || showSettingsAlert}
            onClick={() => setAiProvider('grok')}
            size={'sm'}
            variant={aiProvider === 'grok' ? 'default' : 'ghost'}
          >
            {'Grok'}
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea
        viewportRef={scrollRef}
        className={cn(
          'min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-32px),transparent_100%)]',
          showSettingsAlert && '[&>div>div]:h-full',
        )}
      >
        <div
          className={cn(
            'w-full space-y-6 overflow-hidden p-4',
            showSettingsAlert && 'flex h-full items-center justify-center',
          )}
        >
          {showSettingsAlert && (
            <Alert className={'max-w-sm'}>
              <Settings className={'h-4 w-4'} />

              <AlertTitle>{t('chat.settingsAlert.title')}</AlertTitle>

              <AlertDescription>
                {t('chat.settingsAlert.description')}
              </AlertDescription>

              <div className={'col-start-2 mt-3'}>
                <Button
                  size={'sm'}
                  onClick={() => {
                    navigate('/settings');
                  }}
                >
                  {t('chat.settingsAlert.goToSettings')}
                </Button>
              </div>
            </Alert>
          )}

          {!showSettingsAlert &&
            messages.map((message, index) => {
              const isUser = message.role === CHAT_ROLES.USER;
              const isLastMessage = index === messages.length - 1;
              const isCurrentlyStreaming =
                isStreaming && isLastMessage && !isUser;

              return (
                <div
                  key={index}
                  className={cn(
                    'flex w-full',
                    isUser ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'flex min-w-0 flex-col gap-1 overflow-hidden',
                      isUser ? 'max-w-[85%] items-end' : 'w-full',
                    )}
                  >
                    <div
                      className={cn(
                        'min-w-0 overflow-hidden text-sm',
                        isUser
                          ? 'rounded-3xl rounded-br-sm border border-zinc-200 px-4 py-2.5 dark:border-zinc-700'
                          : 'py-1',
                        isUser
                          ? isPage
                            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                            : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                          : isPage
                            ? 'text-foreground'
                            : 'text-sidebar-foreground',
                      )}
                    >
                      {isUser ? (
                        <span className={'break-words'}>
                          {message.parts[0].text}
                        </span>
                      ) : isCurrentlyStreaming && !message.parts[0].text ? (
                        <LoadingDots />
                      ) : (
                        <div
                          className={
                            'prose prose-sm dark:prose-invert max-w-full break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_code]:break-all'
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
                        className={cn(
                          'flex items-center gap-1 text-xs',
                          isPage
                            ? 'text-muted-foreground'
                            : 'text-sidebar-foreground/60',
                        )}
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
      <div className={'shrink-0 px-4 pt-4 pb-6'}>
        <div
          className={cn(
            'rounded-2xl border p-3 transition-colors',
            isPage
              ? 'border-input bg-muted/40'
              : 'border-sidebar-border bg-sidebar-accent/50',
          )}
        >
          <Textarea
            disabled={showSettingsAlert}
            placeholder={t('chat.placeholder')}
            rows={1}
            value={input}
            className={cn(
              'min-h-[60px] max-h-[200px] w-full resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:bg-transparent',
              isPage
                ? 'text-foreground placeholder:text-muted-foreground'
                : 'text-sidebar-accent-foreground placeholder:text-sidebar-foreground/50',
            )}
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

          <div className={'mt-2 flex items-center justify-between'}>
            <div className={'flex items-center gap-3'}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      disabled={!dataset || showSettingsAlert}
                      onClick={() => setIsAttached(!isAttached)}
                      type={'button'}
                      className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                        isAttached
                          ? isPage
                            ? 'bg-primary/10 text-primary'
                            : 'bg-sidebar-primary/20 text-sidebar-primary'
                          : isPage
                            ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      )}
                    >
                      <Database className={'h-3.5 w-3.5'} />
                      <span>{t('chat.attachDataset')}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isAttached
                      ? t('chat.datasetAttached')
                      : t('chat.attachDatasetTooltip')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      disabled={showSettingsAlert}
                      type={'button'}
                      className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                        isPage
                          ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                          : 'text-sidebar-foreground/60 hover:bg-destructive/20 hover:text-destructive',
                      )}
                      onClick={() => {
                        setMessages((prev) => [prev[0]]);
                        if (user) {
                          clearUserMessages(user.uid);
                        }
                      }}
                    >
                      <Trash2 className={'h-3.5 w-3.5'} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t('chat.clearChat')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button
              disabled={!input.trim() || isStreaming || showSettingsAlert}
              onClick={handleSubmit}
              size={'sm'}
              className={cn(
                'h-8 rounded-xl px-4',
                isPage
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90',
              )}
            >
              <Send className={'mr-1.5 h-3.5 w-3.5'} />
              {t('chat.send')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
