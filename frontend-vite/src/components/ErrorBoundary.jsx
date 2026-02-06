import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center p-10 bg-red-900/50 rounded-3xl border border-red-500">
            <h2 className="text-4xl font-bold text-holy mb-4">¡Oops! Algo salió mal 🚨</h2>
            <p className="text-xl mb-6">Error en el Dashboard. Estamos trabajando en ello.</p>
            <pre className="text-left bg-black/50 p-4 rounded-lg text-sm overflow-auto max-h-96">
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 px-8 py-4 bg-holy text-black font-bold rounded-full hover:scale-105 transition"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;