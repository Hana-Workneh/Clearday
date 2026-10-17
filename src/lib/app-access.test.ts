import { describe, expect, it } from "vitest";
import { appAccess } from "./app-access";
const visitor = { ready: true, profileLoaded: true, hasProfile: false, accountId: null, error: "", setup: false, setupStarted: false };
describe("Safe page entry", () => {
  it.each(["/home", "/pay-faster", "/plan", "/progress", "/settings", "/setup"])("redirects fresh visitors at %s", path => { expect(appAccess({...visitor, setup: path === "/setup"})).toBe("welcome"); });
  it("waits for both session and profile", () => {
    expect(appAccess({...visitor, ready: false})).toBe("loading");
    expect(appAccess({...visitor, profileLoaded: false})).toBe("loading");
  });
  it("allows restored demo and account", () => {
    expect(appAccess({...visitor, hasProfile: true})).toBe("allow");
    expect(appAccess({...visitor, accountId: "owner"})).toBe("allow");
  });
  it("allows intentional setup without unlocking app pages", () => {
    expect(appAccess({...visitor, setup: true, setupStarted: true})).toBe("allow");
    expect(appAccess({...visitor, setupStarted: true})).toBe("welcome");
  });
  it("keeps account read errors out of new-visitor flow", () => { expect(appAccess({...visitor, accountId: "owner", error: "Could not load"})).toBe("error"); });
});
