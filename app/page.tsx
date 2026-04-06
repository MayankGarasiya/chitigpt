"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I'm your AI assistant. How can I help you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);;
  const [file, setFile] = useState<File | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && !file) return;

    const userMsg = { role: "user", content: input || "Uploaded a file" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      let fileKey = null;

      // ✅ Upload file to S3 (Amplify)
      if (file) {
        const { uploadData } = await import("aws-amplify/storage");

        const fileName = `${Date.now()}-${file.name}`;
        const result = await uploadData({
          key: fileName,
          data: file,
        }).result;

        fileKey = result.key;
        setFile(null);
      }

      // ✅ Send to backend
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: input,
          file: fileKey
        })
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: "ai", content: `Error: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
      }

    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "ai", content: "Upload failed" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">

      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-white/10 p-6 flex flex-col hidden md:flex">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <span className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white text-sm">AI</span>
          My ChatGPT
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm opacity-60">Recent History...</div>
        </div>
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">M</div>
            <div className="text-sm font-medium">Mayank</div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-screen">

        <header className="h-16 border-b border-white/10 flex items-center px-8 glass md:bg-transparent md:backdrop-blur-none">
          <h1 className="text-lg font-semibold md:hidden">My ChatGPT</h1>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${msg.role === "user"
                    ? "bg-accent text-white rounded-tr-none"
                    : "bg-white/10 text-white rounded-tl-none"
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white rounded-2xl p-4">
                  ...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-8">
          <div className="max-w-3xl mx-auto space-y-2">

            {/* ✅ File Input */}
            <input
              type="file"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="text-white"
            />

            {/* ✅ Show Selected File */}
            {file && (
              <p className="text-xs text-green-400">
                Selected: {file.name}
              </p>
            )}

            {/* Chat Input */}
            <div className="relative group">
              <input
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-16 text-white"
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
              />

              <button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && !file)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent text-white p-2 rounded-xl"
              >
                ➤
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-white/20 mt-4">
            Powered by Ollama + Llama3
          </p>
        </div>
      </div>
    </div>
  );
}