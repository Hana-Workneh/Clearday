import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoPersona } from "./demo-personas";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser }, from: mocks.from } }));
vi.mock("./account.functions", () => ({ saveAccountProfile: vi.fn() }));

beforeEach(() => { vi.resetModules(); mocks.getUser.mockReset(); mocks.from.mockReset(); sessionStorage.clear(); localStorage.clear(); });
describe("Browser refresh restoration", () => {
  it("restores unchanged Hana loans and payment history after refresh", async () => {
    const hana = createDemoPersona("hana");
    sessionStorage.setItem("clearday-demo", JSON.stringify(hana));
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { name: "AuthSessionMissingError" } });
    const store = await import("./store");
    await store.refreshAccount();
    expect(store.loadProfile()?.loans).toEqual(hana.loans);
    expect(store.loadProfile()?.payments).toEqual(hana.payments);
    expect(store.loadProfile()?.demo).toBe(true);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("recovers damaged demo data as Hana without replacing real local data", async () => {
    sessionStorage.setItem("clearday-demo", "broken");
    localStorage.setItem("clearday-profile", "real draft untouched");
    const store = await import("./store");
    expect(store.loadProfile()?.name).toBe("Hana");
    expect(store.loadProfile()?.loans).toHaveLength(3);
    expect(store.loadProfile()?.payments).toHaveLength(12);
    expect(localStorage.getItem("clearday-profile")).toBe("real draft untouched");
  });
  it("reads back owner-scoped saved account data on each refresh", async () => {
    const { demo, demoPersona, ...saved } = createDemoPersona("hana");
    const eq = vi.fn(() => ({ maybeSingle: async () => ({ data: { data: saved }, error: null }) }));
    mocks.from.mockReturnValue({ select: () => ({ eq }) });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
    const store = await import("./store");
    await store.refreshAccount();
    expect(store.loadProfile()?.loans).toEqual(saved.loans);
    await store.refreshAccount();
    expect(store.loadProfile()?.payments).toEqual(saved.payments);
    expect(eq).toHaveBeenNthCalledWith(1, "id", "owner");
    expect(eq).toHaveBeenNthCalledWith(2, "id", "owner");
  });
  it("settles an unexpected auth rejection into a recoverable error", async () => {
    mocks.getUser.mockRejectedValue(new Error("Network unavailable"));
    const store = await import("./store");
    await expect(store.refreshAccount()).resolves.toBeUndefined();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { name: "AuthSessionMissingError" } });
    await expect(store.refreshAccount()).resolves.toBeUndefined();
    expect(store.loadProfile()).toBeNull();
  });
});