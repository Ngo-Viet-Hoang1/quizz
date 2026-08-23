'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-75 flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Something went wrong</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            {this.state.error?.message || 'Unable to display this section.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={() => this.setState({ hasError: false })}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
