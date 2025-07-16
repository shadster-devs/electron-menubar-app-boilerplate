import { AlertTriangle, RotateCcw, Bug } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to Electron main process (you could extend this to send to crash reporting service)
    if (window.electronAPI) {
      console.error('Sending error to main process:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='error-boundary'>
          <div className='error-boundary-content'>
            <div className='error-icon'>
              <AlertTriangle size={48} />
            </div>

            <h1 className='error-title'>Something went wrong</h1>

            <p className='error-description'>
              The application encountered an unexpected error. You can try to
              continue by clicking &quot;Try Again&quot; or reload the entire
              application.
            </p>

            <div className='error-actions'>
              <button
                className='error-button primary'
                onClick={this.handleReset}
              >
                <RotateCcw size={16} />
                Try Again
              </button>

              <button
                className='error-button secondary'
                onClick={this.handleReload}
              >
                Reload App
              </button>
            </div>

            {/* Development mode: show error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='error-details'>
                <summary className='error-details-summary'>
                  <Bug size={16} />
                  Error Details (Development)
                </summary>

                <div className='error-details-content'>
                  <div className='error-section'>
                    <h3>Error Message:</h3>
                    <pre className='error-message'>
                      {this.state.error.message}
                    </pre>
                  </div>

                  {this.state.error.stack && (
                    <div className='error-section'>
                      <h3>Stack Trace:</h3>
                      <pre className='error-stack'>
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <div className='error-section'>
                      <h3>Component Stack:</h3>
                      <pre className='error-stack'>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default ErrorBoundary;
