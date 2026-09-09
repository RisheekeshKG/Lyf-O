import { useCallback, useState } from "react";
import { api } from "../lib/api";
import { toFileName } from "../lib/slug";
import { invoke } from "../lib/electron";
import type { ChatMessage } from "../types";

let messageId = 0;
const nextId = () => `msg-${++messageId}`;

interface UseChatOptions {
  /** Tool responses write a new page to disk, so the workspace needs re-reading. */
  onFileCreated: () => Promise<void>;
}

export function useChat({ onFileCreated }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const append = (message: Omit<ChatMessage, "id">) =>
    setMessages((current) => [...current, { ...message, id: nextId() }]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || sending) return;

      append({ sender: "user", text: content });
      setSending(true);

      try {
        const data = await api.sendChatMessage(content);

        if (data.mode === "tool" && data.result?.content) {
          const page = data.result.content;
          await invoke("writeFile", toFileName(page.name), JSON.stringify(page, null, 2));
          await onFileCreated();
          append({ sender: "ai", text: `Created a new page: **${page.name}**` });
          return;
        }

        append({ sender: "ai", text: data.generated_text ?? "No response returned." });
      } catch (error: any) {
        append({ sender: "ai", text: `Request failed — ${error.message}` });
      } finally {
        setSending(false);
      }
    },
    [onFileCreated, sending],
  );

  const reset = useCallback(() => setMessages([]), []);

  return { messages, sending, send, reset };
}
