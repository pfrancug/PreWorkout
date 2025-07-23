import { Google } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Button,
  Collapse,
  Container,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FirebaseError, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { useState } from 'react';

import { firebaseConfig } from '../firebase/config';

export const Login = () => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerUser = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log('User registered:', user.email);
    } catch (error) {
      const errorMessage = (error as FirebaseError).message;
      setErrorMessage(errorMessage);
    }
  };

  const loginUser = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log('User logged in:', user.email);
    } catch (error) {
      const errorMessage = (error as FirebaseError).message;
      setErrorMessage(errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Signed in with Google:', user.email, user.displayName);
    } catch (error) {
      const errorMessage = (error as FirebaseError).message;
      setErrorMessage(errorMessage);
    }
  };

  return (
    <Container maxWidth={'xs'} sx={{ mt: 4 }}>
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
            loginUser(email, password);
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
              onClick={() => loginUser(email, password)}
              size={'small'}
              type={'submit'}
              variant={'contained'}
            >
              {'Sign In'}
            </Button>

            <Divider variant={'middle'}>{'or'}</Divider>

            <Button
              onClick={signInWithGoogle}
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
        <form>
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
              onClick={() => registerUser(email, password)}
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
    </Container>
  );
};
