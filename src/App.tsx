import type { IRow } from './types/types';
import type { User } from 'firebase/auth';

import { Add, DeleteSweep, Download } from '@mui/icons-material';
import {
  Container,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  Stack,
  ThemeProvider,
  Tooltip,
  alpha,
  createTheme,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  DataGrid,
  Toolbar,
  ToolbarButton,
  useGridApiContext,
} from '@mui/x-data-grid';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { SparkChart } from './charts/SparkChart';
import { Chat } from './components/Chat';
import { Login } from './components/Login';
import { columns } from './data/columns';
import { firebaseConfig } from './firebase/config';

const app = initializeApp(firebaseConfig);
// const database = getDatabase(app);
const auth = getAuth(app);

const brand = {
  50: 'hsl(210, 100%, 95%)',
  100: 'hsl(210, 100%, 92%)',
  200: 'hsl(210, 100%, 80%)',
  300: 'hsl(210, 100%, 65%)',
  400: 'hsl(210, 98%, 48%)',
  500: 'hsl(210, 98%, 42%)',
  600: 'hsl(210, 98%, 55%)',
  700: 'hsl(210, 100%, 35%)',
  800: 'hsl(210, 100%, 16%)',
  900: 'hsl(210, 100%, 21%)',
};

const gray = {
  50: 'hsl(220, 35%, 97%)',
  100: 'hsl(220, 30%, 94%)',
  200: 'hsl(220, 20%, 88%)',
  300: 'hsl(220, 20%, 80%)',
  400: 'hsl(220, 20%, 65%)',
  500: 'hsl(220, 20%, 42%)',
  600: 'hsl(220, 20%, 35%)',
  700: 'hsl(220, 20%, 25%)',
  800: 'hsl(220, 30%, 6%)',
  900: 'hsl(220, 35%, 3%)',
};

const green = {
  50: 'hsl(120, 80%, 98%)',
  100: 'hsl(120, 75%, 94%)',
  200: 'hsl(120, 75%, 87%)',
  300: 'hsl(120, 61%, 77%)',
  400: 'hsl(120, 44%, 53%)',
  500: 'hsl(120, 59%, 30%)',
  600: 'hsl(120, 70%, 25%)',
  700: 'hsl(120, 75%, 16%)',
  800: 'hsl(120, 84%, 10%)',
  900: 'hsl(120, 87%, 6%)',
};

const orange = {
  50: 'hsl(45, 100%, 97%)',
  100: 'hsl(45, 92%, 90%)',
  200: 'hsl(45, 94%, 80%)',
  300: 'hsl(45, 90%, 65%)',
  400: 'hsl(45, 90%, 40%)',
  500: 'hsl(45, 90%, 35%)',
  600: 'hsl(45, 91%, 25%)',
  700: 'hsl(45, 94%, 20%)',
  800: 'hsl(45, 95%, 16%)',
  900: 'hsl(45, 93%, 12%)',
};

const red = {
  50: 'hsl(0, 100%, 97%)',
  100: 'hsl(0, 92%, 90%)',
  200: 'hsl(0, 94%, 80%)',
  300: 'hsl(0, 90%, 65%)',
  400: 'hsl(0, 90%, 40%)',
  500: 'hsl(0, 90%, 30%)',
  600: 'hsl(0, 91%, 25%)',
  700: 'hsl(0, 94%, 18%)',
  800: 'hsl(0, 95%, 12%)',
  900: 'hsl(0, 93%, 6%)',
};

const App = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const darkTheme = createTheme({
    cssVariables: true,

    palette: {
      mode: 'dark',
      primary: {
        contrastText: brand[50],
        light: brand[300],
        main: brand[400],
        dark: brand[700],
      },
      info: {
        contrastText: brand[300],
        light: brand[500],
        main: brand[700],
        dark: brand[900],
      },
      warning: {
        light: orange[400],
        main: orange[500],
        dark: orange[700],
      },
      error: {
        light: red[400],
        main: red[500],
        dark: red[700],
      },
      success: {
        light: green[400],
        main: green[500],
        dark: green[700],
      },
      grey: {
        ...gray,
      },
      divider: alpha(gray[700], 0.6),
      background: {
        default: gray[900],
        paper: 'hsl(220, 30%, 7%)',
      },
      text: {
        primary: 'hsl(0, 0%, 100%)',
        secondary: gray[400],
      },
      action: {
        hover: alpha(gray[600], 0.2),
        selected: alpha(gray[600], 0.3),
      },
    },
  });

  const [dataSet, setDataSet] = useState<IRow[] | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem('dataSet');

    if (storedData) {
      const parsedData = JSON.parse(storedData).map((row: IRow) => ({
        ...row,
        date: new Date(row.date),
      }));

      setDataSet(parsedData);
    }
  }, []);

  useEffect(() => {
    if (dataSet) {
      localStorage.setItem('dataSet', JSON.stringify(dataSet));
    }
  }, [dataSet]);

  const onRowChange = (newRow: IRow) => {
    const updatedRows = dataSet?.map((oldRow) => {
      if (oldRow.id === newRow.id) {
        return newRow;
      }

      return oldRow;
    });

    setDataSet(updatedRows ?? null);
    return newRow;
  };

  const CustomToolbar = () => {
    const apiRef = useGridApiContext();

    return (
      <Toolbar>
        <Stack
          alignItems={'center'}
          sx={{
            alignItems: 'center',
            flexDirection: 'row',
            gap: 1,
            justifyContent: 'flex-end',
            px: 0.25,
            width: '100%',
          }}
        >
          <Tooltip title={'Add new row'}>
            <ToolbarButton
              render={<IconButton size={'small'} />}
              onClick={() =>
                setDataSet((prev) =>
                  [...(prev ?? [])].concat({
                    id: (prev ?? []).length + 1,
                    date: (prev ?? [])[(prev ?? []).length - 1]?.date
                      ? new Date(
                          (prev ?? [])[(prev ?? []).length - 1].date.getTime() +
                            86400000
                        )
                      : new Date(),
                    weight: 0,
                    kcal: 0,
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                  })
                )
              }
            >
              <Add fontSize={'small'} />
            </ToolbarButton>
          </Tooltip>

          <Divider orientation={'vertical'} sx={{ height: 20 }} />

          <Tooltip title={'Export data as CSV'}>
            <ToolbarButton
              render={<IconButton size={'small'} />}
              onClick={() =>
                apiRef.current.exportDataAsCsv({ fileName: 'data' })
              }
            >
              <Download fontSize={'small'} />
            </ToolbarButton>
          </Tooltip>

          <Divider orientation={'vertical'} sx={{ height: 20 }} />

          <Tooltip title={'Remove selected rows'}>
            <ToolbarButton
              render={<IconButton size={'small'} />}
              onClick={() => {
                const selectedRows = apiRef.current.getSelectedRows();

                selectedRows.forEach((row) => {
                  setDataSet(
                    (prev) => prev?.filter((r) => r.id !== row.id) ?? []
                  );
                });
              }}
            >
              <DeleteSweep fontSize={'small'} />
            </ToolbarButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    );
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // 2. Set up the onAuthStateChanged listener when the component mounts
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // 3. Update the state variable based on the listener's result
      setCurrentUser(user);
      setLoadingAuth(false); // Auth state has been determined
      if (user) {
        console.log('User state updated:', user.uid);
      } else {
        console.log('User state updated: logged out');
      }
    });

    // 4. Return a cleanup function to unsubscribe when the component unmounts
    //    This prevents memory leaks and unnecessary listeners
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  if (loadingAuth) {
    return <div>{'Loading authentication state...'}</div>;
  }

  // const logoutUser = async () => {
  //   try {
  //     await signOut(auth);
  //     console.log('User logged out successfully.');
  //     // The onAuthStateChanged listener will detect this change and update your UI
  //   } catch (error) {
  //     console.error('Error logging out:', error);
  //   }
  // };

  // if (!currentUser) {
  //   console.error('User not authenticated. Please sign in to send messages.');
  // }

  // const handleSetData = async () => {
  //   if (!currentUser) {
  //     return;
  //   }

  //   const messagesRef = ref(database, 'messages');

  //   try {
  //     await push(messagesRef, {
  //       text: 'test',
  //       senderId: currentUser.uid,
  //       timestamp: serverTimestamp(),
  //       isBot: false,
  //     });
  //     console.log('User message sent successfully!');
  //   } catch (error) {
  //     console.error('Error sending user message:', error);
  //   }
  // };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      {!currentUser ? <Login /> : null}

      {currentUser ? (
        <Container maxWidth={'xl'} sx={{ p: isMobile ? 2 : 3, width: '100%' }}>
          {/* <Button
            fullWidth
            onClick={handleSetData}
            sx={{ m: 2 }}
            variant={'outlined'}
          >
            {'Set Data '}
          </Button>

          <Button onClick={logoutUser} variant={'outlined'}>
            {'Log Out'}
          </Button> */}

          <Grid container spacing={3}>
            {/* ---- Chart Section ---- */}

            <Grid container size={12} spacing={{ xs: 2, md: 3 }}>
              <Grid size={{ xs: 12, lg: 4 }}>
                <SparkChart color={'primary'} data={dataSet} value={'weight'} />
              </Grid>

              <Grid size={{ xs: 6, lg: 4 }}>
                <SparkChart color={'warning'} data={dataSet} value={'kcal'} />
              </Grid>

              <Grid size={{ xs: 6, lg: 4 }}>
                <SparkChart
                  color={'success'}
                  data={dataSet}
                  value={'protein'}
                />
              </Grid>
            </Grid>

            {/* ---- Data Grid Section ---- */}

            <Grid size={{ xs: 12, lg: 6 }}>
              <Stack>
                <Stack height={650} width={'100%'}>
                  <DataGrid
                    checkboxSelection
                    disableColumnFilter
                    disableColumnMenu
                    disableColumnResize
                    showToolbar
                    columns={columns}
                    density={'compact'}
                    editMode={'row'}
                    pageSizeOptions={[14]}
                    processRowUpdate={onRowChange}
                    rows={dataSet ?? undefined}
                    slots={{ toolbar: CustomToolbar }}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 14 } },
                      sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
                    }}
                    sx={{
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: (theme) => theme.palette.divider,
                    }}
                  />
                </Stack>
              </Stack>
            </Grid>

            {/* ---- Chat Section ---- */}

            <Grid size={{ xs: 12, lg: 6 }}>
              <Chat dataset={dataSet} />
            </Grid>
          </Grid>
        </Container>
      ) : null}
    </ThemeProvider>
  );
};

export default App;
