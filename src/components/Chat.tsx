import type { IRow } from '../types/types';
import type { AIConfig } from '@lib/ai/types';
import type { ChangeEvent, KeyboardEvent } from 'react';

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
import { BicepsFlexed, Database, Send, Settings, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Streamdown } from 'streamdown';

import { CHAT_ROLES } from '../constants/storage';
import { useAuth } from '../contexts/useAuth';
import { useSettings } from '../contexts/useSettings';
import {
  clearUserMessages,
  getRemainingMessages,
  saveUserMessages,
  subscribeToUserMessages,
} from '../firebase/database';
import {
  isGeminiAvailable,
  isGrokAvailable,
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

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  const smoothScrollToBottom = (duration: number) => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const start = el.scrollTop;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-in-out
      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - (-2 * progress + 2) ** 2 / 2;

      // Recalculate target each frame in case content height changed
      const target = el.scrollHeight - el.clientHeight;
      const distance = target - start;
      el.scrollTop = start + distance * ease;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Ensure we're at the very bottom
        el.scrollTop = el.scrollHeight;
      }
    };

    requestAnimationFrame(step);
  };

  const [input, setInput] = useState('');
  const [isAttached, setIsAttached] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [remainingMessages, setRemainingMessages] = useState<number>(10);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;

    if (!el) {
      return;
    }

    const handleScroll = () => {
      setIsAtTop(el.scrollTop <= 1);
      setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 1);
    };

    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });

    return () => el.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  const isLimitReached = remainingMessages <= 0;
  const isUnlimited = remainingMessages === Infinity;

  // Load remaining daily message count
  useEffect(() => {
    if (!user) {
      return;
    }

    getRemainingMessages(user.uid).then(setRemainingMessages);
  }, [user]);

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

    let isFirst = true;
    const unsubscribe = subscribeToUserMessages(
      user.uid,
      (firebaseMessages) => {
        if (firebaseMessages.length > 0) {
          setMessages(firebaseMessages);

          // On first load from Firebase, do a slow smooth scroll
          if (isFirst) {
            isFirst = false;
            isAnimating.current = true;
            setTimeout(() => {
              smoothScrollToBottom(2000);
              setTimeout(() => {
                isAnimating.current = false;
              }, 2600);
            }, 100);
          }
        }
      },
    );

    return () => unsubscribe();
  }, [user]);

  const isAnimating = useRef(false);

  // Auto-scroll to bottom whenever messages change (except during initial animation)
  useEffect(() => {
    if (isAnimating.current) {
      return;
    }

    requestAnimationFrame(() => scrollToBottom());
  }, [messages]);

  const handleSubmit = async () => {
    if (!user || isLimitReached) {
      return;
    }

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

    const baseInstruction =
      userInfo.length > 0
        ? `You are a helpful fitness and nutrition assistant. The user's profile: ${userInfo.join(', ')}. Use this information to provide personalized advice.`
        : 'You are a helpful fitness and nutrition assistant.';

    // Build conversation context: keep last 20 messages as full context,
    // summarize older messages into a compact prefix for the system prompt
    const MAX_RECENT = 10;
    let conversationSummary = '';
    let recentMessages = messages;

    if (messages.length > MAX_RECENT) {
      const olderMessages = messages.slice(0, -MAX_RECENT);
      recentMessages = messages.slice(-MAX_RECENT);

      // Build a compact summary of older conversation topics
      const olderUserMessages = olderMessages
        .filter((m) => m.role === 'user')
        .map((m) => m.parts[0].text.substring(0, 150))
        .join(' | ');

      const olderModelMessages = olderMessages
        .filter((m) => m.role === 'model')
        .map((m) => m.parts[0].text.substring(0, 150))
        .join(' | ');

      conversationSummary =
        `\n\nEarlier in this conversation, the user asked about: ${olderUserMessages.substring(0, 1000)}` +
        `\nYour earlier responses covered: ${olderModelMessages.substring(0, 1000)}` +
        `\nUse this context to maintain continuity but focus on the recent messages.`;
    }

    const systemInstruction = baseInstruction + conversationSummary;

    const aiMessages = recentMessages.map((m) => ({
      role: (m.role === 'model' ? 'assistant' : 'user') as
        | 'user'
        | 'assistant'
        | 'system',
      content: m.parts[0].text,
    }));

    const aiConfig: AIConfig = {
      systemInstruction,
      messages: aiMessages,
      userMessage: userMessageContent,
      authToken: await user.getIdToken(),
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

    const tryProvider = async (provider: AIProvider): Promise<boolean> => {
      try {
        if (provider === 'grok' && isGrokAvailable()) {
          await streamFromGrok(aiConfig, callbacks);

          return true;
        } else if (provider === 'gemini' && isGeminiAvailable()) {
          await streamFromGemini(aiConfig, callbacks);

          return true;
        }

        return false;
      } catch (error) {
        console.error(`${provider} failed:`, error);

        return false;
      }
    };

    const fallbackProvider: AIProvider =
      aiProvider === 'gemini' ? 'grok' : 'gemini';

    try {
      let success = await tryProvider(aiProvider);

      if (!success) {
        console.log(`Falling back to ${fallbackProvider}...`);
        setAiProvider(fallbackProvider);

        // Reset the model message for the retry
        finalMessages = [...messages, newUserMessage, emptyModelMessage];
        setMessages(finalMessages);

        // Skip rate limit on fallback — primary already counted
        aiConfig.skipRateLimit = true;
        success = await tryProvider(fallbackProvider);
      }

      if (!success) {
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
        try {
          await saveUserMessages(user.uid, finalMessages);
          const remaining = await getRemainingMessages(user.uid);
          setRemainingMessages(remaining);
        } catch {
          toast.error(t('common.saveError'));
        }
      }
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
      {isPage ? (
        <div className={'shrink-0 px-6 pt-6 space-y-1'}>
          <div className={'flex items-center justify-between'}>
            <h1 className={'text-3xl font-bold tracking-tight'}>
              {t('chat.title')}
            </h1>

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
          </div>

          <p className={'text-muted-foreground'}>{t('chat.description')}</p>
        </div>
      ) : (
        <header
          className={'flex h-12 shrink-0 items-center justify-between px-4'}
        >
          <div className={'flex items-center gap-2'}>
            <BicepsFlexed className={'h-4 w-4 text-sidebar-foreground/70'} />

            <span className={'text-sm font-medium'}>{t('chat.title')}</span>

            <BicepsFlexed
              className={'h-4 w-4 -scale-x-100 text-sidebar-foreground/70'}
            />
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
      )}

      {/* Messages */}
      <ScrollArea
        viewportRef={scrollRef}
        className={cn(
          'min-h-0 flex-1',
          !isAtTop &&
            !isAtBottom &&
            '[mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_calc(100%-32px),transparent_100%)]',
          !isAtTop &&
            isAtBottom &&
            '[mask-image:linear-gradient(to_bottom,transparent_0%,black_32px,black_100%)]',
          isAtTop &&
            !isAtBottom &&
            '[mask-image:linear-gradient(to_bottom,black_0%,black_calc(100%-32px),transparent_100%)]',
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
                    navigate('/settings/profile');
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
                            'prose prose-sm dark:prose-invert max-w-full break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_code]:break-all [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto'
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
        {user && !isUnlimited && (
          <p
            className={cn(
              'mb-2 text-center text-xs',
              isLimitReached
                ? 'text-destructive'
                : isPage
                  ? 'text-muted-foreground'
                  : 'text-sidebar-foreground/50',
            )}
          >
            {isLimitReached
              ? t('chat.limitReached')
              : t('chat.remainingMessages', {
                  count: remainingMessages,
                })}
          </p>
        )}

        <div
          className={cn(
            'rounded-2xl border p-3 transition-colors',
            isPage
              ? 'border-input bg-muted/40'
              : 'border-sidebar-border bg-sidebar-accent/50',
          )}
        >
          <Textarea
            disabled={showSettingsAlert || isLimitReached}
            rows={1}
            value={input}
            className={cn(
              'min-h-[60px] max-h-[200px] w-full resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:bg-transparent',
              isPage
                ? 'text-foreground placeholder:text-muted-foreground'
                : 'text-sidebar-accent-foreground placeholder:text-sidebar-foreground/50',
            )}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (
                input.trim() &&
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isStreaming &&
                !isLimitReached
              ) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              isLimitReached ? t('chat.limitReached') : t('chat.placeholder')
            }
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
                          clearUserMessages(user.uid).catch(() => {
                            toast.error(t('common.saveError'));
                          });
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
              onClick={handleSubmit}
              size={'sm'}
              className={cn(
                'h-8 rounded-xl px-4',
                isPage
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90',
              )}
              disabled={
                !input.trim() ||
                isStreaming ||
                showSettingsAlert ||
                isLimitReached
              }
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
