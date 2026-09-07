// 利用規約・プライバシーポリシーで共通利用する文書データの型

// 番号付き・箇条書きの項目（ネストした箇条書きを持てる）
export type LegalDocumentItem = {
  text: string;
  children?: string[];
};

// 小見出しと本文・リストで構成される記事ブロック
export type LegalDocumentArticle = {
  title?: string;
  lead?: string;
  paragraphs?: string[];
  items?: LegalDocumentItem[];
  // 項目のリスト形式。未指定の場合は番号付き（ordered）
  layout?: "ordered" | "unordered";
};

// 章
export type LegalDocumentSection = {
  heading: string;
  // false の場合は見出し番号を付与しない
  showHeadingNumber?: boolean;
  articles: LegalDocumentArticle[];
};

export type LegalDocumentContent = {
  title: string;
  preamble: string[];
  sections: LegalDocumentSection[];
};
