import { describe, it, expect } from "vitest";
import { generateServiceSlug } from "./service-slug";

describe("generateServiceSlug", () => {
  describe(".NET dotted PascalCase names", () => {
    it("strips Warren.Core prefix and converts PascalCase", () => {
      expect(generateServiceSlug("Warren.Core.API.Cash")).toBe("api-cash");
    });

    it("handles API.Portfolios", () => {
      expect(generateServiceSlug("Warren.Core.API.Portfolios")).toBe(
        "api-portfolios",
      );
    });

    it("handles Consumer.Order", () => {
      expect(generateServiceSlug("Warren.Core.Consumer.Order")).toBe(
        "consumer-order",
      );
    });

    it("handles Consumer.ProcessPortfolio (multi-word PascalCase)", () => {
      expect(
        generateServiceSlug("Warren.Core.Consumer.ProcessPortfolio"),
      ).toBe("consumer-process-portfolio");
    });

    it("handles simple suffix like Hangfire", () => {
      expect(generateServiceSlug("Warren.Core.Hangfire")).toBe("hangfire");
    });

    it("handles multi-segment suffix like Funds.Schedules", () => {
      expect(generateServiceSlug("Warren.Core.Funds.Schedules")).toBe(
        "funds-schedules",
      );
    });

    it("handles Administration", () => {
      expect(generateServiceSlug("Warren.Core.Administration")).toBe(
        "administration",
      );
    });

    it("handles Warren.Intranet (no Core prefix)", () => {
      expect(generateServiceSlug("Warren.Intranet")).toBe("intranet");
    });

    it("handles FixedIncome.Consumer.Order (PascalCase compound)", () => {
      expect(
        generateServiceSlug("Warren.Core.FixedIncome.Consumer.Order"),
      ).toBe("fixed-income-consumer-order");
    });

    it("handles API.Galgo", () => {
      expect(generateServiceSlug("Warren.Core.API.Galgo")).toBe("api-galgo");
    });

    it("handles Consumer.Sinacor", () => {
      expect(generateServiceSlug("Warren.Core.Consumer.Sinacor")).toBe(
        "consumer-sinacor",
      );
    });

    it("handles non-Warren prefix (no stripping)", () => {
      expect(generateServiceSlug("Acme.Platform.API.Users")).toBe(
        "acme-platform-api-users",
      );
    });

    it("handles single segment dotted name", () => {
      expect(generateServiceSlug("Warren.Scheduler")).toBe("scheduler");
    });
  });

  describe("already kebab-case names", () => {
    it("returns kebab-case as-is", () => {
      expect(generateServiceSlug("oms-api")).toBe("oms-api");
    });

    it("returns simple kebab name as-is", () => {
      expect(generateServiceSlug("auth-api")).toBe("auth-api");
    });

    it("returns longer kebab name as-is", () => {
      expect(generateServiceSlug("notification-email-worker")).toBe(
        "notification-email-worker",
      );
    });

    it("returns single lowercase word as-is", () => {
      expect(generateServiceSlug("scheduler")).toBe("scheduler");
    });
  });
});
