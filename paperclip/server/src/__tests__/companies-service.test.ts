import { describe, expect, it } from "vitest";
import {
  buildIssuePrefixCandidate,
  deriveIssuePrefixBase,
} from "../services/companies.ts";

describe("company issue prefix allocation", () => {
  it("derives a short alphabetic base from the company name", () => {
    expect(deriveIssuePrefixBase("THEFT")).toBe("THE");
    expect(deriveIssuePrefixBase("brutal")).toBe("BRU");
    expect(deriveIssuePrefixBase("123 !!!")).toBe("CMP");
  });

  it("uses bounded numeric suffixes for duplicate names", () => {
    expect(buildIssuePrefixCandidate("THE", 1)).toBe("THE");
    expect(buildIssuePrefixCandidate("THE", 2)).toBe("THE2");
    expect(buildIssuePrefixCandidate("THE", 47)).toBe("THE47");
  });
});
