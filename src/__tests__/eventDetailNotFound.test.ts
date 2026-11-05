import { metadata } from "@/app/(main)/event/[id]/not-found";
import { PAGE_TITLES } from "@/constants/pageTitles";
import { describe, expect, it } from "vitest";

describe("EventDetailNotFound", () => {
  it("404用のタブタイトルを設定する", () => {
    expect(metadata.title).toBe(PAGE_TITLES.EVENT_DETAIL_NOT_FOUND);
  });
});
