// モックで使う画像URLを共通化し、next.config.ts の許可パターンとの検証に使う。
// アバターは next/image の unoptimized で表示するため、remotePatterns には含めない。
const mockAvatarUrl = (imageId: number): string =>
  `https://i.pravatar.cc/150?img=${imageId}`;

const mockSmallAvatarUrl = (profileId: string): string =>
  `https://i.pravatar.cc/64?u=${encodeURIComponent(profileId)}`;

export const MOCK_AVATAR_URLS = {
  avatar1: mockAvatarUrl(1),
  avatar2: mockAvatarUrl(2),
  avatar3: mockAvatarUrl(3),
  avatar4: mockAvatarUrl(4),
  avatar5: mockAvatarUrl(5),
  avatar6: mockAvatarUrl(6),
  myProfile: mockAvatarUrl(9),
  smallProfile2: mockSmallAvatarUrl("profile-2"),
} as const;

export const mockEventImageUrls = (index: number): string[] => [
  `https://picsum.photos/1200/600?random=${index * 3 + 1}`,
  `https://picsum.photos/1200/600?random=${index * 3 + 2}`,
  `https://picsum.photos/1200/600?random=${index * 3 + 3}`,
];

export const mockReportImageUrls = (index: number): string[] => [
  `https://picsum.photos/600/400?random=${index * 5 + 1}`,
  `https://picsum.photos/600/400?random=${index * 5 + 2}`,
];
