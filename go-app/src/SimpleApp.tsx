import React from 'react'

function SimpleApp() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">TEUXDEUX</h1>
        <p className="text-gray-600">React app is working!</p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800">If you see this, the React app is loading correctly.</p>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;