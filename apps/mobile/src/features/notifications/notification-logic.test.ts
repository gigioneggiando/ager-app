import type { NotificationsPage } from "@ager/api-client";
import type { InfiniteData } from "@tanstack/react-query";

import { toApiPlatform } from "@/features/push/register-device";

import {
  flattenNotifications,
  markAllRead,
  markOneRead,
  unreadCountOf,
} from "./notification-cache";
import { routeForNotification, routeForPushData } from "./notification-routing";

function page(
  items: { id: number; isRead: boolean }[],
  unreadCount: number,
): NotificationsPage {
  return { items, unreadCount };
}

function inbox(...pages: NotificationsPage[]): InfiniteData<NotificationsPage> {
  return { pages, pageParams: pages.map(() => undefined) };
}

describe("notification cache", () => {
  const data = inbox(
    page(
      [
        { id: 1, isRead: false },
        { id: 2, isRead: true },
      ],
      2,
    ),
    page([{ id: 3, isRead: false }], 2),
  );

  it("flattens + reads the unread count", () => {
    expect(flattenNotifications(data).map((n) => n.id)).toEqual([1, 2, 3]);
    expect(unreadCountOf(data)).toBe(2);
    expect(unreadCountOf(undefined)).toBe(0);
  });

  it("markOneRead flips the item and decrements unread", () => {
    const next = markOneRead(data, 1);
    expect(flattenNotifications(next).find((n) => n.id === 1)?.isRead).toBe(
      true,
    );
    expect(unreadCountOf(next)).toBe(1);
  });

  it("markOneRead on an already-read item does not decrement", () => {
    expect(unreadCountOf(markOneRead(data, 2))).toBe(2);
  });

  it("markAllRead reads everything and zeroes unread", () => {
    const next = markAllRead(data);
    expect(flattenNotifications(next).every((n) => n.isRead)).toBe(true);
    expect(unreadCountOf(next)).toBe(0);
  });
});

describe("deep-link routing", () => {
  it("routes suggested-interest notifications to the interests editor", () => {
    expect(
      routeForNotification({
        type: "SuggestedInterest",
        entityType: "Interest",
      }),
    ).toBe("/interests");
    expect(routeForNotification({ type: "Unknown" })).toBeNull();
  });

  it("routes push payloads by type or interestId", () => {
    expect(
      routeForPushData({ type: "SuggestedInterest", interestId: "7" }),
    ).toBe("/interests");
    expect(routeForPushData({ interestId: 7 })).toBe("/interests");
    expect(routeForPushData({ type: "other" })).toBeNull();
    expect(routeForPushData(null)).toBeNull();
  });
});

describe("toApiPlatform", () => {
  it("maps RN OS to the API enum", () => {
    expect(toApiPlatform("ios")).toBe("Ios");
    expect(toApiPlatform("android")).toBe("Android");
    expect(toApiPlatform("web")).toBeNull();
  });
});
