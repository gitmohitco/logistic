import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AppRouter } from './router';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Shell Protected">
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
