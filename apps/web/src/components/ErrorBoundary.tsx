import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className='min-h-screen flex items-center justify-center bg-background p-4'>
          <div className='max-w-md w-full bg-card border border-border rounded-lg p-6 text-center'>
            <div className='flex justify-center mb-4'>
              <div className='rounded-full bg-destructive/10 p-3'>
                <AlertTriangle className='h-8 w-8 text-destructive' />
              </div>
            </div>

            <h2 className='text-2xl font-bold mb-2 text-foreground'>
              Oops! Something went wrong
            </h2>

            <p className='text-muted-foreground mb-6'>
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mb-4 text-left'>
                <summary className='cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground mb-2'>
                  Error Details (Development Only)
                </summary>
                <pre className='text-xs bg-muted p-3 rounded overflow-auto max-h-40 text-left'>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className='flex gap-3 justify-center'>
              <Button onClick={this.handleReset} variant='default'>
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant='outline'
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
