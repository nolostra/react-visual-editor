import React from 'react';
import ComponentEditor from './ComponentEditor';
import './index.css'; // Import Tailwind and other styles

function App() {
  return (
    <div className="App min-h-screen bg-gray-50 p-8 w-full">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        React Tailwind Component Visual Editor
      </h1>
      <div className="w-full mx-auto">
        <ComponentEditor />
      </div>
    </div>
  );
}

export default App;
