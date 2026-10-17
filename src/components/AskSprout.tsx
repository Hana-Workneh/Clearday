import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { Sprout } from "./Sprout";
import { Button } from "./ui/button";
import { Conversation, ConversationContent } from "./ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "./ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "./ai-elements/prompt-input";
import { useAccount, useProfile, type Profile } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { suggestedQuestions } from "@/lib/sprout-chat";
import { saveStoppedSproutMessage } from "@/lib/sprout-chat.functions";
import { toast } from "sonner";

const DEMO_HISTORY = "clearday-sprout-demo";
export function AskSprout() {
  const profile = useProfile();
  const account = useAccount();
  const [open, setOpen] = useState(false);
  if (!profile || (!profile.demo && !account.id)) return null;
  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          aria-label="Ask Sprout"
          title="Ask Sprout"
          variant="outline"
          className="fixed bottom-[152px] right-5 z-30 h-16 w-16 rounded-full border-2 bg-card p-0 shadow-lg md:bottom-6"
        >
          <Sprout mood="waving" size={58} />
        </Button>
      )}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Ask Sprout"
          className="fixed bottom-[78px] right-3 z-40 flex h-[min(620px,calc(100dvh-96px))] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-[28px_28px_28px_8px] border bg-card shadow-xl md:bottom-6 md:right-6"
        >
          <header className="flex items-center gap-2 border-b px-4 py-2">
            <Sprout mood="happy" size={48} />
            <div className="flex-1">
              <h2 className="font-heading text-xl font-semibold">Ask Sprout</h2>
              <p className="text-xs text-muted-foreground">A little clarity for your next step</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close Ask Sprout"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </header>
          <ChatWindow
            key={profile.demo ? "demo" : account.id}
            profile={profile}
            owner={account.id}
          />
        </div>
      )}
    </>
  );
}
function ChatWindow({ profile, owner }: { profile: Profile; owner: string | null }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const current = useRef(profile);
  current.current = profile;
  const savedAbort = useRef(false);
  const saveStopped = useServerFn(saveStoppedSproutMessage);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [text, setText] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/sprout",
        body: () => ({
          demo: !!current.current.demo,
          ...(current.current.demo ? { profile: current.current } : {}),
        }),
        headers: async () => {
          if (current.current.demo) return {};
          const {
            data: { session },
          } = await supabase.auth.getSession();
          return session ? { Authorization: `Bearer ${session.access_token}` } : {};
        },
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          if (!response.ok) {
            const body = (await response.json().catch(() => null)) as { message?: string } | null;
            throw new Error(body?.message || "Sprout couldn't answer right now.");
          }
          return response;
        },
      }),
    [],
  );
  const { messages, setMessages, sendMessage, status, error, stop, clearError } = useChat({
    id: profile.demo ? "sprout-demo" : `sprout-${owner}`,
    transport,
    onFinish: async ({ message, isAbort }) => {
      if (isAbort && !current.current.demo && !savedAbort.current) {
        savedAbort.current = true;
        const partial = message.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("\n");
        try {
          await saveStopped({ data: { id: message.id, text: partial } });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Your stopped answer couldn't be saved.");
        }
      }
      textarea.current?.focus();
    },
  });
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (profile.demo) {
          const raw = sessionStorage.getItem(DEMO_HISTORY);
          if (raw && active) setMessages(JSON.parse(raw) as UIMessage[]);
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) throw new Error("Please sign in again.");
          const response = await fetch("/api/sprout", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const body = (await response.json()) as { messages?: UIMessage[]; message?: string };
          if (!response.ok) throw new Error(body.message);
          if (active) setMessages(body.messages ?? []);
        }
        if (active) {
          setLoaded(true);
          textarea.current?.focus();
        }
      } catch (e) {
        if (active)
          setLoadError(e instanceof Error ? e.message : "Your conversation could not load.");
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [profile.demo, setMessages]);
  useEffect(() => {
    if (loaded && profile.demo) sessionStorage.setItem(DEMO_HISTORY, JSON.stringify(messages));
  }, [loaded, profile.demo, messages]);
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => {
    if (!busy && loaded) textarea.current?.focus();
  }, [busy, loaded]);
  const send = (question: string) => {
    if (!question.trim() || busy || !loaded) return;
    clearError();
    savedAbort.current = false;
    setText("");
    void sendMessage({ text: question.trim() });
    textarea.current?.focus();
  };
  return (
    <>
      <Conversation className="min-h-0">
        <ConversationContent className="gap-4">
          {!loaded && (
            <p className="text-sm text-muted-foreground">
              {loadError || "Finding your conversation..."}
            </p>
          )}
          {messages.map((message) => (
            <Message from={message.role} key={message.id} className="max-w-full">
              <MessageContent
                className={
                  message.role === "user"
                    ? "!bg-primary !text-primary-foreground rounded-[20px_20px_6px_20px]"
                    : "!bg-transparent text-foreground"
                }
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {busy && (
            <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sprout mood="thinking" size={54} />
              <span>Sprout is thinking...</span>
            </div>
          )}
          {error && (
            <div role="alert" className="leaf bg-chip-purple p-3 text-sm text-chip-purple-text">
              <Sprout mood="calm" size={45} />
              {error.message}
            </div>
          )}
        </ConversationContent>
      </Conversation>
      {loaded && messages.length === 0 && (
        <div className="space-y-2 px-4 pb-3">
          {suggestedQuestions.map((question) => (
            <Button
              key={question}
              variant="outline"
              onClick={() => send(question)}
              disabled={busy}
              className="h-auto w-full justify-start whitespace-normal rounded-full px-3 py-2 text-left text-xs"
            >
              {question}
            </Button>
          ))}
        </div>
      )}
      <div className="border-t p-3">
        <PromptInput onSubmit={({ text: question }) => send(question)}>
          <PromptInputTextarea
            ref={textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            aria-label="Ask Sprout a question"
            maxLength={1000}
            disabled={!loaded}
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={status}
              onStop={stop}
              disabled={!loaded || (!busy && !text.trim())}
              className="rounded-full"
            />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Planning tool, not financial advice
        </p>
      </div>
    </>
  );
}
