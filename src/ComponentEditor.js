import React, { useState } from 'react';
import CodeEditor from './CodeEditor';

const initialCode = `

  
  const MyComponent = () => {
    return(  <h3 className="border bg-yellow-500 text-white p-4 rounded-md w-6">
      Hello World! 👋
    </h3>);
  };

  render(<Wrapper><MyComponent /></Wrapper>);
`;

const ComponentEditor = () => {
  const [code, setCode] = useState(initialCode);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Edit Component Code</h2>
      
      {/* Code Editor */}
      <div className="mb-8">
        <CodeEditor code={code} onCodeChange={handleCodeChange} />
      </div>

      {/* Live Preview Section */}
      <h2 className="text-xl font-semibold mb-2">Live Preview</h2>
      <div className="border p-4 bg-gray-100 rounded-md shadow-md">
        {/* Rendering the live component */}
        <div dangerouslySetInnerHTML={{ __html: code }} />
      </div>
    </div>
  );
};

export default ComponentEditor;
