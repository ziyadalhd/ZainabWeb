import { describe, expect, it } from "vitest";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("declares Arabic and RTL at the document root", () => {
    const layout = RootLayout({ children: <main /> });
    expect(layout.props.lang).toBe("ar");
    expect(layout.props.dir).toBe("rtl");
  });
});
