import { useCallback, useEffect, useState } from "react";
import { invoke } from "../lib/electron";
import type { GmailMessage } from "../types";

type AuthState = "checking" | "signed-out" | "signed-in";

export function useGmail() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setStatus("Fetching inbox…");
    try {
      const res = await invoke<{ success: boolean; messages?: GmailMessage[]; error?: string }>(
        "gmail-list",
        25,
      );

      if (!res.success) {
        setStatus(res.error ?? "Failed to load inbox");
        if (res.error?.includes("sign in") || res.error?.includes("token")) {
          setAuthState("signed-out");
        }
        return;
      }

      setMessages(res.messages ?? []);
      setStatus(`Loaded ${res.messages?.length ?? 0} messages`);
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await invoke<{ authorized?: boolean }>("gmail-check-auth");
        if (res?.authorized) {
          setAuthState("signed-in");
          await fetchInbox();
        } else {
          setAuthState("signed-out");
        }
      } catch {
        setAuthState("signed-out");
      }
    })();
  }, [fetchInbox]);

  const signIn = useCallback(async () => {
    setLoading(true);
    setStatus("Opening Google sign-in…");
    try {
      const res = await invoke<{ success: boolean; error?: string }>("gmail-auth");
      if (!res.success) {
        setStatus(`Sign-in failed: ${res.error}`);
        setAuthState("signed-out");
        return;
      }

      // The loopback redirect completes out of band; give it a moment to store the token.
      setStatus("Waiting for authorization to complete…");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const check = await invoke<{ authorized?: boolean }>("gmail-check-auth");
      if (check?.authorized) {
        setAuthState("signed-in");
        await fetchInbox();
      } else {
        setStatus("Sign-in may not have completed. Please try again.");
        setAuthState("signed-out");
      }
    } catch (error: any) {
      setStatus(error.message);
      setAuthState("signed-out");
    } finally {
      setLoading(false);
    }
  }, [fetchInbox]);

  const signOut = useCallback(async () => {
    await invoke("gmail-signout");
    setMessages([]);
    setAuthState("signed-out");
    setStatus("Signed out");
  }, []);

  return { authState, messages, status, loading, signIn, signOut, refresh: fetchInbox };
}

export function headerOf(message: GmailMessage, name: string, fallback = ""): string {
  return message.headers.find((header) => header.name === name)?.value ?? fallback;
}
