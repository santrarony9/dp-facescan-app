import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Editor Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-8 text-center rounded-2xl">
          <h2 className="text-xl font-bold text-red-500 mb-2">Editor Crashed</h2>
          <p className="text-slate-300 text-sm">{this.state.error?.message}</p>
          <button 
            onClick={() => this.props.onClose()}
            className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold"
          >
            Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
