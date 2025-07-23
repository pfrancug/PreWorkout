import type { IRow } from '../types/types';

import { GoogleGenAI } from '@google/genai';
import { DatasetOutlined, DeleteSweep, Send } from '@mui/icons-material';
import {
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Roles } from '../enums/roles';

interface Props {
  dataset: IRow[] | null;
}

interface Message {
  role: string;
  parts: { text: string }[];
  attachedDataset?: IRow[];
}

export const Chat = ({ dataset }: Props) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY ?? null;

  if (!apiKey) {
    throw new Error(
      'API key is not set. Please set VITE_GEMINI_API_KEY in your environment variables.'
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [isAttached, setIsAttached] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Roles.Model,
      parts: [
        {
          text: 'This is beginning of a conversation about nutrition tracking.',
        },
      ],
    },
  ]);

  // Load messages from local storage on initial render
  useEffect(() => {
    const storedMessages = localStorage.getItem('chatMessages');

    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }, 0);
  }, []);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async () => {
    const trimmedText = input.trim();
    const newUserMessage: Message = {
      role: Roles.User,
      parts: [{ text: trimmedText }],
      attachedDataset: isAttached && dataset ? [...dataset] : undefined,
    };

    setInput('');
    setIsAttached(false);
    setMessages((prev) => [...prev, newUserMessage]);

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [...messages, messagesWithDataset],
    });

    const newModelMessage = {
      role: 'model',
      parts: [{ text: response.text ?? 'Error' }],
    };

    setMessages((prev) => [...prev, newModelMessage]);
  };

  return (
    <Stack
      sx={{
        width: '100%',
        height: 650,
        gap: 3,
        alignItems: 'center',
      }}
    >
      {/* auto scroll to bottom */}
      <Card
        sx={{
          borderColor: (theme) => theme.palette.divider,
          borderRadius: 4,
          borderStyle: 'solid',
          borderWidth: 1,
          height: '100%',
          maxHeight: '100%',
          overflowY: 'auto',
          p: 2,
          width: '100%',
        }}
      >
        <Stack gap={2}>
          {messages.map((message) => {
            if (message.role === Roles.User) {
              return (
                <Card
                  key={message.parts[0].text}
                  sx={{
                    alignSelf: 'flex-end',
                    bgcolor: (theme) => theme.palette.primary.dark,
                    borderRadius: 3,
                    height: 'auto',
                    maxWidth: '75%',
                    width: 'fit-content',
                  }}
                >
                  <CardContent
                    sx={{
                      'px': 1.5,
                      'py': 1,

                      '&:last-child': {
                        pb: 1,
                      },
                    }}
                  >
                    <Typography variant={'caption'}>
                      {message.parts[0].text}
                    </Typography>
                  </CardContent>

                  {message.attachedDataset ? (
                    <CardActions
                      sx={{
                        justifyContent: 'flex-end',
                        mt: -1.5,
                      }}
                    >
                      <Tooltip title={'Data attached'}>
                        <DatasetOutlined />
                      </Tooltip>
                    </CardActions>
                  ) : null}
                </Card>
              );
            }

            return (
              <Card
                key={message.parts[0].text}
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: (theme) => theme.palette.action.focus,
                  borderRadius: 3,
                  height: 'auto',
                  maxWidth: '75%',
                  width: 'fit-content',
                }}
              >
                <CardContent
                  sx={{
                    'p': 0,
                    'px': 1.5,
                    'py': 0,

                    '&:last-child': {
                      pb: 0,
                    },
                  }}
                >
                  <Typography variant={'caption'}>
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {message.parts[0].text}
                    </Markdown>
                  </Typography>
                </CardContent>
              </Card>
            );
          })}

          <Stack ref={messagesEndRef} sx={{ my: -1 }} />
        </Stack>
      </Card>

      <Card
        variant={'outlined'}
        sx={{
          borderRadius: 4,
          overflow: 'visible',
          width: '100%',
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 1,
            alignItems: 'center',
            width: '100%',
            px: 2,
            py: 1,
          }}
        >
          <InputBase
            fullWidth
            multiline
            maxRows={4}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'Type your message here...'}
            type={'text'}
            value={input}
            onKeyDown={(event) => {
              if (input.trim() && event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
          />

          <Divider flexItem orientation={'vertical'} sx={{ mx: 1 }} />

          <IconButton
            aria-label={'directions'}
            color={'primary'}
            disabled={!input.trim()}
            onClick={handleSubmit}
          >
            <Send />
          </IconButton>
        </CardContent>

        <Divider />

        <CardActions
          sx={{
            py: 0.5,
            flexDirection: 'row',
            display: 'flex',
            gap: 1,
          }}
        >
          <FormControlLabel
            disabled={!dataset}
            control={
              <Checkbox
                checked={isAttached}
                color={'primary'}
                onChange={(event) => setIsAttached(event.target.checked)}
                size={'small'}
              />
            }
            label={
              <Typography color={'textSecondary'} variant={'caption'}>
                {'Attach data'}
              </Typography>
            }
            sx={{
              ml: 0,
              mr: 0.5,
            }}
          />

          <Divider orientation={'vertical'} sx={{ height: 20 }} />

          <Tooltip title={'Clear chat'}>
            <IconButton
              size={'small'}
              onClick={() => {
                setMessages((prev) => [prev[0]]);
                localStorage.removeItem('chatMessages');
              }}
            >
              <DeleteSweep fontSize={'small'} />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    </Stack>
  );
};
