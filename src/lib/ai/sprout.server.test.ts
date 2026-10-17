import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  provider: vi.fn(),
  generation: vi.fn(),
  claim: vi.fn(),
  table: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.auth } }),
}));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: mocks.provider }));
vi.mock("ai", async (original) => ({
  ...(await original<typeof import("ai")>()),
  streamText: mocks.generation,
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc: mocks.claim, from: mocks.table },
}));
import { handleSprout } from "./sprout.server";
import { chatFacts, checkedChatAnswer, SPROUT_LIMIT_MESSAGE } from "../sprout-chat";
import { createDemoPersona } from "../demo-personas";

const profile = {
  name: "Hana",
  income: 500,
  job: "Marketing officer",
  currency: "USD" as const,
  loans: [
    { id: "phone", name: "Phone loan", balance: 140, startBalance: 300, rate: 9, payment: 40 },
  ],
};
function request(question: string, demo = true, signedIn = false) {
  return new Request("https://clearday.example/api/sprout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signedIn ? { Authorization: "Bearer test-token" } : {}),
    },
    body: JSON.stringify({
      demo,
      profile,
      messages: [{ id: "question", role: "user", parts: [{ type: "text", text: question }] }],
    }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://example.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-key");
  vi.stubEnv("LOVABLE_API_KEY", "");
  mocks.claim.mockResolvedValue({ data: true, error: null });
  mocks.auth.mockResolvedValue({ data: { user: { id: "account-a" } } });
});
describe("Ask Sprout anonymous spending protection", () => {
  it.each(["hana", "kofi", "maya", "grace"] as const)("uses %s's own demo finances without paid AI", async id => {
    const sample = createDemoPersona(id);
    const question = "If I get a $10k raise, how much sooner am I debt free?";
    const response = await handleSprout(new Request("https://clearday.example/api/sprout", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({demo:true,profile:sample,messages:[{id:"raise",role:"user",parts:[{type:"text",text:question}]}]}),
    }));
    expect(response.status).toBe(200);
    const {facts,fallback} = chatFacts(sample,question);
    expect(await response.text()).toContain(JSON.stringify(checkedChatAnswer(fallback,facts,fallback)));
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.table).not.toHaveBeenCalled();
  });
  it.each([
    "What if I pay $50 more?",
    "Which loan should I pay first?",
    "Can I afford a $300 phone?",
    "When will I be debt free?",
    "What if I pay $100 extra?",
  ])("answers demo question without AI: %s", async (question) => {
    const response = await handleSprout(request(question));
    expect(response.status).toBe(200);
    const body = await response.text();
    const { facts, fallback } = chatFacts(profile, question);
    expect(body).toContain(JSON.stringify(checkedChatAnswer(fallback, facts, fallback)));
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.generation).not.toHaveBeenCalled();
    expect(mocks.table).not.toHaveBeenCalled();
    expect(mocks.claim).toHaveBeenCalledWith(
      "claim_sprout_question",
      expect.objectContaining({ _demo: true }),
    );
  });
  it("still returns free demo replies with a signed-in caller", async () => {
    vi.stubEnv("LOVABLE_API_KEY", "test-ai-key");
    expect((await handleSprout(request("help", true, true))).status).toBe(200);
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.generation).not.toHaveBeenCalled();
  });
  it("blocks anonymous callers who disable demo mode", async () => {
    expect((await handleSprout(request("help", false))).status).toBe(401);
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.generation).not.toHaveBeenCalled();
  });
  it("preserves the server-enforced demo limit", async () => {
    mocks.claim.mockResolvedValue({ data: false, error: null });
    const response = await handleSprout(request("help"));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ message: SPROUT_LIMIT_MESSAGE });
    expect(mocks.provider).not.toHaveBeenCalled();
  });
});
