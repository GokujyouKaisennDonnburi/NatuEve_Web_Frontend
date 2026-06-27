// イベント詳細の費用の型定義
export type EventDetailCost = {
  category: string;
  cost: number;
};

// イベント詳細のアイテムの型定義
export type EventDetailItem = {
  item: string;
  isRequired: boolean;
};

// イベント詳細の型定義
export type EventDetailType = {
  id: string;
  title: string;
  description: string;
  imageObjectKeys?: string[];
  pdfObjectKeys?: string[];
  location: string;
  eventDate: string;
  capacity?: number;
  costs: EventDetailCost[];
  items?: EventDetailItem[];
};
