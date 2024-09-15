import React, { useState, useCallback } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import { Rnd } from 'react-rnd';
import debounce from 'lodash/debounce';

// Helper component to wrap the user's code
const Wrapper = ({ children }) => <div>{children}</div>;

const CodeEditor = ({ initialCode, onCodeChange, scope = {} }) => {
  const [internalCode, setInternalCode] = useState(`
    const MyComponent = () => {
      return (
        <h3 
          className="border bg-yellow-500 text-white p-4 rounded-md" 
          style={{
            width: '200px',
            height: '100px',
            position: 'absolute',
            left: '0px',
            top: '0px'
          }}
        >
          Hello World! 👋
        </h3>
      );
    };
  
    render(<Wrapper><MyComponent /></Wrapper>);
  `);

  const [previewDimensions, setPreviewDimensions] = useState({
    width: 200,
    height: 100,
    x: 0,
    y: 0
  });

  const updateCode = useCallback((newDimensions) => {
    const updatedCode = internalCode.replace(
      /style=\{[^}]+\}/,
      `style={{
        width: '${newDimensions.width}',
        height: '${newDimensions.height}',
        position: 'absolute',
        left: '${newDimensions.x}px',
        top: '${newDimensions.y}px'
      }`
    );
    setInternalCode(updatedCode);
    onCodeChange(updatedCode);
  }, [internalCode, onCodeChange]);

  const handleCodeChange = useCallback(
    debounce((newCode) => {
      setInternalCode(newCode);
      onCodeChange(newCode);
    }, 300),
    [onCodeChange]
  );

  const handlePreviewUpdate = (e, direction, ref, delta, position) => {
    const newDimensions = {
      width: ref.style.width,
      height: ref.style.height,
      x: position.x,
      y: position.y
    };
    setPreviewDimensions(newDimensions);
    updateCode(newDimensions);
  };

  const enhancedScope = { ...scope, Wrapper };

  return (
    <LiveProvider code={internalCode} scope={enhancedScope} noInline={true}>
      <div className="flex h-screen bg-gray-100">
        {/* Fixed Code Editor */}
        <div className="w-1/2 h-full border-r border-gray-300">
          <div className="bg-gray-200 p-2">Code Editor</div>
          <LiveEditor
            onChange={handleCodeChange}
            className="h-[calc(100%-40px)] overflow-auto text-sm font-mono bg-gray-900 text-white p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Code Editor"
          />
        </div>
        {/* Movable and Resizable Preview */}
        <div className="w-1/2 h-full relative">
          <div className="border border-gray-300 bg-white rounded-md shadow-sm h-full">
            <div className="bg-gray-200 p-2">Preview</div>
            <div className="p-4 h-[calc(100%-40px)] overflow-auto relative">
              <Rnd
                size={{ width: previewDimensions.width, height: previewDimensions.height }}
                position={{ x: previewDimensions.x, y: previewDimensions.y }}
                onDragStop={(e, d) => handlePreviewUpdate(e, null, { style: { width: `${previewDimensions.width }`, height: `${previewDimensions.height}` } }, null, d)}
                onResizeStop={(e, direction, ref, delta, position) => handlePreviewUpdate(e, direction, ref, delta, position)}
                bounds="parent"
              >
                <LiveError className="text-red-500 mb-2" />
                <LivePreview aria-label="Component Preview" />
              </Rnd>
            </div>
          </div>
        </div>
      </div>
    </LiveProvider>
  );
};

export default CodeEditor;