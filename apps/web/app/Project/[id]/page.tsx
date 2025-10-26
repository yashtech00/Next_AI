import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

export default function ProjectPage({ projectId }: { projectId: string }) {
  const [code, setCode] = useState("// Waiting for AI...");
  const eventSourceRef = useRef(null);

  // Trigger AI generation
  const sendPrompt = async (prompt :any) => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    // Open SSE stream
    eventSourceRef.current = new EventSource(
      `http://localhost:5000/prompt-stream?prompt=${encodeURIComponent(prompt)}&projectId=${projectId}`
    );

    let liveCode = "";

    eventSourceRef.current.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSourceRef.current.close();
        return;
      }
      liveCode += event.data;
      setCode(liveCode); // update Monaco
    };
  };

  useEffect(() => {
    // Example: trigger automatically on load
    sendPrompt("Build a simple Next.js login page component");
  }, []);

  return (
    <div className="h-screen">
      <Editor
        height="100%"
        theme="vs-dark"
        language="javascript"
        value={code}
        options={{ readOnly: true }}
      />
    </div>
  );
}
