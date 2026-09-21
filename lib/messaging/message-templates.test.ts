import { describe, expect, it } from "vitest";
import {
  findMissingTokens,
  messageTemplateDefinitions,
  messageTemplateKindByMessageKind,
  messageTemplateKinds,
  renderMessageTemplate,
} from "@/lib/messaging/message-templates";
import { manualMessageKinds } from "@/lib/messaging/manual-messages";

const values = {
  attendeeName: "سارة",
  eventTitle: "أمسية ثقافية",
  eventDate: "الخميس ٢٠ أغسطس",
  managementUrl: "https://example.com/bookings/token",
};

describe("message templates", () => {
  it("maps every manual message kind onto an editable template", () => {
    for (const kind of manualMessageKinds) {
      const templateKind = messageTemplateKindByMessageKind[kind];
      expect(messageTemplateKinds).toContain(templateKind);
    }
  });

  it("keeps every default body free of leftover tokens once rendered", () => {
    for (const kind of messageTemplateKinds) {
      const rendered = renderMessageTemplate(messageTemplateDefinitions[kind].defaultBody, values);
      expect(rendered).not.toContain("{{");
    }
  });

  it("ships defaults that already satisfy their own required tokens", () => {
    for (const kind of messageTemplateKinds) {
      expect(findMissingTokens(kind, messageTemplateDefinitions[kind].defaultBody)).toEqual([]);
    }
  });

  it("declares every required token as an offered token", () => {
    for (const kind of messageTemplateKinds) {
      const definition = messageTemplateDefinitions[kind];
      for (const token of definition.requiredTokens) {
        expect(definition.tokens).toContain(token);
      }
    }
  });

  it("names the required tokens a body is missing", () => {
    expect(findMissingTokens("registration_reminder", "نص بلا متغيرات")).toEqual([
      "{{attendee_name}}",
      "{{event_title}}",
      "{{management_url}}",
    ]);
  });

  it("treats the cancellation notice as link-free", () => {
    expect(messageTemplateDefinitions.cancellation.tokens).not.toContain("{{management_url}}");
    expect(findMissingTokens("cancellation", "نص مختصر")).toEqual([]);
  });

  it("substitutes every occurrence of a token", () => {
    expect(renderMessageTemplate("{{attendee_name}} و{{attendee_name}}", values)).toBe("سارة وسارة");
  });
});
