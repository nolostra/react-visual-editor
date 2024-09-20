import React, { useState, useCallback } from "react";
import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";
import { Rnd, RndResizeCallback, RndDragCallback } from "react-rnd";
import debounce from "lodash/debounce";
import OpenAI from "openai";

// Helper component to wrap the user's code
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

interface Dimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  scope?: Record<string, unknown>;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onCodeChange,
  scope = {},
}) => {
  const [internalCode, setInternalCode] = useState<string>(code);

  const [previewDimensions, setPreviewDimensions] = useState<Dimensions>({
    width: 200,
    height: 100,
    x: 0,
    y: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const updateCode = useCallback(
    (newDimensions: Dimensions, suggestedChanges: string | null = null) => {
      let updatedCode = internalCode;

      if (suggestedChanges) {
        updatedCode = suggestedChanges;
      } else {
        updatedCode = updatedCode.replace(
          /style=\{[^}]+\}/,
          `style={{
            width: '${newDimensions.width}px',
            height: '${newDimensions.height}px',
            position: 'absolute',
            left: '${newDimensions.x}px',
            top: '${newDimensions.y}px'
          }}`
        );
      }

      setInternalCode(updatedCode);
      onCodeChange(updatedCode);
    },
    [internalCode, onCodeChange]
  );

  const handleCodeChange = useCallback(
    debounce((newCode: string) => {
      setInternalCode(newCode);
      onCodeChange(newCode);
    }, 300),
    [onCodeChange]
  );

  const getGPTSuggestions = async (
    currentCode: string,
    newDimensions: Dimensions
  ): Promise<string | null> => {
    setIsLoading(true);
    const prompt = `
    Given the following React component code and new dimensions:
    ${currentCode}
    New dimensions: ${JSON.stringify(newDimensions)}
    Please update the component using CSS Flexbox or Grid layout properties such as justify-content, align-items, and flex-direction.
    Avoid using fixed dimensions like width, height, left, or top.
    Do not include extra formatting or triple quotes around the code. Only return the JSX code and the render function with no additional explanations.
    Ensure the layout is based on relative positioning using Flexbox or Grid properties.
    Only return the JSX code directly, without any explanations or additional formatting.
    `;

    try {
      const openai = new OpenAI({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });
      // Remove the second argument in the generateText call
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
      });

      setIsLoading(false);

      // Assuming response contains a 'text' field
      const suggestedText = response.choices?.[0]?.message?.content;

      if (suggestedText) {
        return suggestedText; // This is now properly treated as a string
      }
      console.log("data", response);

      return null;
    } catch (error) {
      console.error("Error getting GPT suggestions:", error);
      setIsLoading(false);
      return null;
    }
  };

  const handleResizeStop: RndResizeCallback = async (
    e,
    direction,
    ref,
    delta,
    position
  ) => {
    const newDimensions: Dimensions = {
      width: parseInt(ref.style.width),
      height: parseInt(ref.style.height),
      x: position.x,
      y: position.y,
    };
    setPreviewDimensions(newDimensions);

    const gptSuggestions = await getGPTSuggestions(internalCode, newDimensions);

    if (gptSuggestions) {
      updateCode(newDimensions, gptSuggestions);
    } else {
      updateCode(newDimensions);
    }
  };

  const handleDragStop: RndDragCallback = (e, data) => {
    const newDimensions: Dimensions = {
      width: previewDimensions.width,
      height: previewDimensions.height,
      x: data.x,
      y: data.y,
    };
    setPreviewDimensions(newDimensions);

    // You can perform the asynchronous action inside but don't make the function async
    getGPTSuggestions(internalCode, newDimensions).then((gptSuggestions) => {
      if (gptSuggestions) {
        updateCode(newDimensions, gptSuggestions);
      } else {
        updateCode(newDimensions);
      }
    });

    // No return value required, as the function is now synchronous
  };

  const enhancedScope: Record<string, unknown> = { ...scope, Wrapper };

  return (
    <LiveProvider code={internalCode} scope={enhancedScope} noInline={true}>
      <div className="flex h-screen bg-gray-100">
        <div className="w-1/2 h-full border-r border-gray-300">
          <div className="bg-gray-200 p-2">Code Editor</div>
          <LiveEditor
            onChange={handleCodeChange}
            className="h-[calc(100%-40px)] overflow-auto text-sm font-mono bg-gray-900 text-white p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Code Editor"
          />
        </div>
        <div className="w-1/2 h-full relative">
          <div className="border border-gray-300 bg-white rounded-md shadow-sm h-full">
            <div className="bg-gray-200 p-2">
              Preview {isLoading && "(Loading GPT suggestions...)"}
            </div>
            <div className="p-4 h-[calc(100%-40px)] overflow-auto relative">
              <Rnd
                size={{
                  width: previewDimensions.width,
                  height: previewDimensions.height,
                }}
                position={{ x: previewDimensions.x, y: previewDimensions.y }}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
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
