import { Google } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Button,
  Collapse,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { loginUser, registerUser, signInWithGoogle } from '../firebase/auth';

export const LoginPage = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  return (
    <Stack justifySelf={'center'} maxWidth={350} minWidth={250} width={'100%'}>
      <Typography
        gutterBottom
        sx={{ mb: 5 }}
        textAlign={'center'}
        variant={'h5'}
      >
        {'Pre Workout Login'}
      </Typography>

      <Collapse in={Boolean(errorMessage)} sx={{ mb: 2 }}>
        <Alert
          onClose={() => setErrorMessage(null)}
          severity={'error'}
          sx={{ mb: 2 }}
          variant={'outlined'}
        >
          <AlertTitle gutterBottom={false}>{errorMessage}</AlertTitle>
        </Alert>
      </Collapse>

      {!isRegister ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loginUser({ email, password, onError: setErrorMessage });
          }}
        >
          <Stack
            sx={{
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <TextField
              fullWidth
              placeholder={'Email'}
              size={'small'}
              type={'email'}
              value={email}
              variant={'outlined'}
              onChange={(e) => {
                setErrorMessage(null);
                setEmail(e.target.value);
              }}
            />

            <TextField
              fullWidth
              placeholder={'Password'}
              size={'small'}
              type={'password'}
              value={password}
              variant={'outlined'}
              onChange={(e) => {
                setErrorMessage(null);
                setPassword(e.target.value);
              }}
            />

            <Button
              fullWidth
              size={'small'}
              type={'submit'}
              variant={'contained'}
            >
              {'Sign In'}
            </Button>

            <Divider variant={'middle'}>{'or'}</Divider>

            <Button
              onClick={() => signInWithGoogle({ onError: setErrorMessage })}
              startIcon={<Google />}
              variant={'outlined'}
            >
              {'Sign In with Google'}
            </Button>

            <Stack
              sx={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant={'body2'}>
                {"Don't have an account?"}
              </Typography>

              <Link
                component={'button'}
                underline={'none'}
                onClick={() => {
                  setErrorMessage(null);
                  setEmail('');
                  setPassword('');
                  setIsRegister(true);
                }}
              >
                <Typography variant={'body2'}>{'Sign Up'}</Typography>
              </Link>
            </Stack>
          </Stack>
        </form>
      ) : null}

      {isRegister ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerUser({ email, password, onError: setErrorMessage });
          }}
        >
          <Stack
            sx={{
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <TextField
              fullWidth
              placeholder={'Email'}
              size={'small'}
              type={'email'}
              value={email}
              variant={'outlined'}
              onChange={(e) => {
                setErrorMessage(null);
                setEmail(e.target.value);
              }}
            />

            <TextField
              fullWidth
              placeholder={'Password'}
              size={'small'}
              type={'password'}
              value={password}
              variant={'outlined'}
              onChange={(e) => {
                setErrorMessage(null);
                setPassword(e.target.value);
              }}
            />

            <Button
              fullWidth
              size={'small'}
              type={'submit'}
              variant={'contained'}
            >
              {'Sign Up'}
            </Button>

            <Stack
              sx={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant={'body2'}>
                {'Already have an account?'}
              </Typography>

              <Link
                component={'button'}
                underline={'none'}
                onClick={() => {
                  setErrorMessage(null);
                  setEmail('');
                  setPassword('');
                  setIsRegister(false);
                }}
              >
                <Typography variant={'body2'}>{'Sign In'}</Typography>
              </Link>
            </Stack>
          </Stack>
        </form>
      ) : null}
    </Stack>
  );
};
