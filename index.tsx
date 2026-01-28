
import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component to catch crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare state and props to resolve TS2339 errors
  state: ErrorBoundaryState;
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          fontFamily: 'sans-serif', 
          textAlign: 'center', 
          backgroundColor: '#000', 
          color: '#fff', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>Ops! Algo deu errado.</h1>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>O aplicativo encontrou um erro inesperado.</p>
          <div style={{ 
            background: '#1f2937', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            textAlign: 'left', 
            overflow: 'auto', 
            maxWidth: '80%',
            marginBottom: '2rem',
            border: '1px solid #374151'
          }}>
            <code style={{ color: '#f87171' }}>{this.state.error?.message}</code>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('metaChefUser'); // Clear potential corrupted data
              window.location.reload();
            }} 
            style={{ 
              padding: '1rem 2rem', 
              background: '#ccff00', 
              color: '#000', 
              border: 'none', 
              borderRadius: '0.75rem', 
              cursor: 'pointer', 
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Resetar e Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
