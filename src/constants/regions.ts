// src/constants/regions.ts

// 都道府県と市（東京都は特別区）を管理する型
export interface Prefecture {
  readonly name: string;
  readonly hiragana: string;
  readonly cities: readonly City[];
}

// 市（東京都は特別区）を管理する型
export interface City {
  readonly name: string;
  readonly hiragana: string;
}

// 地域と都道府県のデータを定義するための型
export interface Region {
  readonly name: string;
  readonly hiragana: string;
  readonly prefectures: readonly Prefecture[];
}

// イベント一覧の地域フィルターで利用する地域・都道府県・市（東京都は特別区）のデータ
export const REGIONS: readonly Region[] = [
  // 北海道
  {
    name: "北海道",
    hiragana: "ほっかいどう",
    prefectures: [
      {
        name: "北海道",
        hiragana: "ほっかいどう",
        cities: [
          { name: "札幌市", hiragana: "さっぽろし" },
          { name: "函館市", hiragana: "はこだてし" },
          { name: "旭川市", hiragana: "あさひかわし" },
          { name: "小樽市", hiragana: "おたるし" },
          { name: "帯広市", hiragana: "おびひろし" },
          { name: "釧路市", hiragana: "くしろし" },
          { name: "北見市", hiragana: "きたみし" },
          { name: "苫小牧市", hiragana: "とまこまいし" },
          { name: "江別市", hiragana: "えべつし" },
          { name: "千歳市", hiragana: "ちとせし" },
        ],
      },
    ],
  },

  // 東北地方
  {
    name: "東北",
    hiragana: "？？",
    prefectures: [
      {
        name: "青森県",
        hiragana: "？？",
        cities: [
          { name: "青森市", hiragana: "？？" },
          { name: "弘前市", hiragana: "？？" },
          { name: "八戸市", hiragana: "？？" },
          { name: "十和田市", hiragana: "？？" },
          { name: "むつ市", hiragana: "？？" },
        ],
      },
      {
        name: "岩手県",
        hiragana: "？？",
        cities: [
          { name: "盛岡市", hiragana: "？？" },
          { name: "宮古市", hiragana: "？？" },
          { name: "大船渡市", hiragana: "？？" },
          { name: "花巻市", hiragana: "？？" },
          { name: "北上市", hiragana: "？？" },
          { name: "一関市", hiragana: "？？" },
          { name: "奥州市", hiragana: "？？" },
        ],
      },
      {
        name: "宮城県",
        hiragana: "？？",
        cities: [
          { name: "仙台市", hiragana: "？？" },
          { name: "石巻市", hiragana: "？？" },
          { name: "塩竈市", hiragana: "？？" },
          { name: "名取市", hiragana: "？？" },
          { name: "多賀城市", hiragana: "？？" },
        ],
      },
      {
        name: "秋田県",
        hiragana: "？？",
        cities: [
          { name: "秋田市", hiragana: "？？" },
          { name: "能代市", hiragana: "？？" },
          { name: "横手市", hiragana: "？？" },
          { name: "大館市", hiragana: "？？" },
          { name: "大仙市", hiragana: "？？" },
        ],
      },
      {
        name: "山形県",
        hiragana: "？？",
        cities: [
          { name: "山形市", hiragana: "？？" },
          { name: "米沢市", hiragana: "？？" },
          { name: "鶴岡市", hiragana: "？？" },
          { name: "酒田市", hiragana: "？？" },
          { name: "天童市", hiragana: "？？" },
        ],
      },
      {
        name: "福島県",
        hiragana: "？？",
        cities: [
          { name: "福島市", hiragana: "？？" },
          { name: "会津若松市", hiragana: "？？" },
          { name: "郡山市", hiragana: "？？" },
          { name: "いわき市", hiragana: "？？" },
          { name: "白河市", hiragana: "？？" },
        ],
      },
    ],
  },

  // 関東地方
  {
    name: "関東",
    hiragana: "？？",
    prefectures: [
      {
        name: "茨城県",
        hiragana: "？？",
        cities: [
          { name: "水戸市", hiragana: "？？" },
          { name: "日立市", hiragana: "？？" },
          { name: "土浦市", hiragana: "？？" },
          { name: "つくば市", hiragana: "？？" },
          { name: "ひたちなか市", hiragana: "？？" },
        ],
      },
      {
        name: "栃木県",
        hiragana: "？？",
        cities: [
          { name: "宇都宮市", hiragana: "？？" },
          { name: "足利市", hiragana: "？？" },
          { name: "栃木市", hiragana: "？？" },
          { name: "佐野市", hiragana: "？？" },
          { name: "小山市", hiragana: "？？" },
        ],
      },
      {
        name: "群馬県",
        hiragana: "？？",
        cities: [
          { name: "前橋市", hiragana: "？？" },
          { name: "高崎市", hiragana: "？？" },
          { name: "桐生市", hiragana: "？？" },
          { name: "伊勢崎市", hiragana: "？？" },
          { name: "太田市", hiragana: "？？" },
        ],
      },
      {
        name: "埼玉県",
        hiragana: "？？",
        cities: [
          { name: "さいたま市", hiragana: "？？" },
          { name: "川越市", hiragana: "？？" },
          { name: "川口市", hiragana: "？？" },
          { name: "所沢市", hiragana: "？？" },
          { name: "越谷市", hiragana: "？？" },
        ],
      },
      {
        name: "千葉県",
        hiragana: "？？",
        cities: [
          { name: "千葉市", hiragana: "？？" },
          { name: "船橋市", hiragana: "？？" },
          { name: "松戸市", hiragana: "？？" },
          { name: "柏市", hiragana: "？？" },
          { name: "市川市", hiragana: "？？" },
        ],
      },
      {
        name: "東京都",
        hiragana: "？？",
        cities: [
          { name: "千代田区", hiragana: "？？" },
          { name: "中央区", hiragana: "？？" },
          { name: "港区", hiragana: "？？" },
          { name: "新宿区", hiragana: "？？" },
          { name: "文京区", hiragana: "？？" },
          { name: "台東区", hiragana: "？？" },
          { name: "墨田区", hiragana: "？？" },
          { name: "江東区", hiragana: "？？" },
          { name: "品川区", hiragana: "？？" },
          { name: "目黒区", hiragana: "？？" },
          { name: "大田区", hiragana: "？？" },
          { name: "世田谷区", hiragana: "？？" },
          { name: "渋谷区", hiragana: "？？" },
          { name: "中野区", hiragana: "？？" },
          { name: "杉並区", hiragana: "？？" },
          { name: "豊島区", hiragana: "？？" },
          { name: "北区", hiragana: "？？" },
          { name: "荒川区", hiragana: "？？" },
          { name: "板橋区", hiragana: "？？" },
          { name: "練馬区", hiragana: "？？" },
          { name: "足立区", hiragana: "？？" },
          { name: "葛飾区", hiragana: "？？" },
          { name: "江戸川区", hiragana: "？？" },
        ],
      },
      {
        name: "神奈川県",
        hiragana: "？？",
        cities: [
          { name: "横浜市", hiragana: "？？" },
          { name: "川崎市", hiragana: "？？" },
          { name: "相模原市", hiragana: "？？" },
          { name: "横須賀市", hiragana: "？？" },
          { name: "藤沢市", hiragana: "？？" },
          { name: "鎌倉市", hiragana: "？？" },
          { name: "平塚市", hiragana: "？？" },
          { name: "厚木市", hiragana: "？？" },
          { name: "小田原市", hiragana: "？？" },
        ],
      },
    ],
  },

  // 中部地方
  {
    name: "中部",
    hiragana: "？？",
    prefectures: [
      {
        name: "新潟県",
        hiragana: "？？",
        cities: [
          { name: "新潟市", hiragana: "？？" },
          { name: "長岡市", hiragana: "？？" },
          { name: "上越市", hiragana: "？？" },
        ],
      },
      {
        name: "富山県",
        hiragana: "？？",
        cities: [
          { name: "富山市", hiragana: "？？" },
          { name: "高岡市", hiragana: "？？" },
        ],
      },
      {
        name: "石川県",
        hiragana: "？？",
        cities: [
          { name: "金沢市", hiragana: "？？" },
          { name: "小松市", hiragana: "？？" },
        ],
      },
      {
        name: "福井県",
        hiragana: "？？",
        cities: [
          { name: "福井市", hiragana: "？？" },
          { name: "敦賀市", hiragana: "？？" },
        ],
      },
      {
        name: "山梨県",
        hiragana: "？？",
        cities: [
          { name: "甲府市", hiragana: "？？" },
          { name: "富士吉田市", hiragana: "？？" },
        ],
      },
      {
        name: "長野県",
        hiragana: "？？",
        cities: [
          { name: "長野市", hiragana: "？？" },
          { name: "松本市", hiragana: "？？" },
          { name: "上田市", hiragana: "？？" },
        ],
      },
      {
        name: "岐阜県",
        hiragana: "？？",
        cities: [
          { name: "岐阜市", hiragana: "？？" },
          { name: "大垣市", hiragana: "？？" },
          { name: "各務原市", hiragana: "？？" },
        ],
      },
      {
        name: "静岡県",
        hiragana: "？？",
        cities: [
          { name: "静岡市", hiragana: "？？" },
          { name: "浜松市", hiragana: "？？" },
          { name: "沼津市", hiragana: "？？" },
          { name: "富士市", hiragana: "？？" },
        ],
      },
      {
        name: "愛知県",
        hiragana: "？？",
        cities: [
          { name: "名古屋市", hiragana: "？？" },
          { name: "豊田市", hiragana: "？？" },
          { name: "岡崎市", hiragana: "？？" },
          { name: "一宮市", hiragana: "？？" },
          { name: "豊橋市", hiragana: "？？" },
        ],
      },
    ],
  },

  // 近畿地方
  {
    name: "近畿",
    hiragana: "？？",
    prefectures: [
      {
        name: "三重県",
        hiragana: "？？",
        cities: [
          { name: "津市", hiragana: "？？" },
          { name: "四日市市", hiragana: "？？" },
          { name: "鈴鹿市", hiragana: "？？" },
          { name: "伊勢市", hiragana: "？？" },
        ],
      },
      {
        name: "滋賀県",
        hiragana: "？？",
        cities: [
          { name: "大津市", hiragana: "？？" },
          { name: "草津市", hiragana: "？？" },
          { name: "彦根市", hiragana: "？？" },
          { name: "長浜市", hiragana: "？？" },
        ],
      },
      {
        name: "京都府",
        hiragana: "？？",
        cities: [
          { name: "京都市", hiragana: "？？" },
          { name: "宇治市", hiragana: "？？" },
          { name: "亀岡市", hiragana: "？？" },
          { name: "舞鶴市", hiragana: "？？" },
        ],
      },
      {
        name: "大阪府",
        hiragana: "？？",
        cities: [
          { name: "大阪市", hiragana: "？？" },
          { name: "堺市", hiragana: "？？" },
          { name: "豊中市", hiragana: "？？" },
          { name: "吹田市", hiragana: "？？" },
          { name: "高槻市", hiragana: "？？" },
          { name: "枚方市", hiragana: "？？" },
          { name: "東大阪市", hiragana: "？？" },
          { name: "八尾市", hiragana: "？？" },
        ],
      },
      {
        name: "兵庫県",
        hiragana: "？？",
        cities: [
          { name: "神戸市", hiragana: "？？" },
          { name: "姫路市", hiragana: "？？" },
          { name: "尼崎市", hiragana: "？？" },
          { name: "西宮市", hiragana: "？？" },
          { name: "明石市", hiragana: "？？" },
          { name: "伊丹市", hiragana: "？？" },
          { name: "宝塚市", hiragana: "？？" },
          { name: "加古川市", hiragana: "？？" },
          { name: "芦屋市", hiragana: "？？" },
        ],
      },
      {
        name: "奈良県",
        hiragana: "？？",
        cities: [
          { name: "奈良市", hiragana: "？？" },
          { name: "橿原市", hiragana: "？？" },
          { name: "生駒市", hiragana: "？？" },
        ],
      },
      {
        name: "和歌山県",
        hiragana: "？？",
        cities: [
          { name: "和歌山市", hiragana: "？？" },
          { name: "田辺市", hiragana: "？？" },
          { name: "橋本市", hiragana: "？？" },
        ],
      },
    ],
  },

  // 中国地方
  {
    name: "中国",
    hiragana: "？？",
    prefectures: [
      {
        name: "鳥取県",
        hiragana: "？？",
        cities: [
          { name: "鳥取市", hiragana: "？？" },
          { name: "米子市", hiragana: "？？" },
        ],
      },
      {
        name: "島根県",
        hiragana: "？？",
        cities: [
          { name: "松江市", hiragana: "？？" },
          { name: "出雲市", hiragana: "？？" },
        ],
      },
      {
        name: "岡山県",
        hiragana: "？？",
        cities: [
          { name: "岡山市", hiragana: "？？" },
          { name: "倉敷市", hiragana: "？？" },
          { name: "津山市", hiragana: "？？" },
        ],
      },
      {
        name: "広島県",
        hiragana: "？？",
        cities: [
          { name: "広島市", hiragana: "？？" },
          { name: "福山市", hiragana: "？？" },
          { name: "呉市", hiragana: "？？" },
          { name: "東広島市", hiragana: "？？" },
        ],
      },
      {
        name: "山口県",
        hiragana: "？？",
        cities: [
          { name: "山口市", hiragana: "？？" },
          { name: "下関市", hiragana: "？？" },
          { name: "宇部市", hiragana: "？？" },
        ],
      },
    ],
  },

  // 四国地方
  {
    name: "四国",
    hiragana: "？？",
    prefectures: [
      {
        name: "徳島県",
        hiragana: "？？",
        cities: [
          { name: "徳島市", hiragana: "？？" },
          { name: "阿南市", hiragana: "？？" },
        ],
      },
      {
        name: "香川県",
        hiragana: "？？",
        cities: [
          { name: "高松市", hiragana: "？？" },
          { name: "丸亀市", hiragana: "？？" },
        ],
      },
      {
        name: "愛媛県",
        hiragana: "？？",
        cities: [
          { name: "松山市", hiragana: "？？" },
          { name: "今治市", hiragana: "？？" },
          { name: "新居浜市", hiragana: "？？" },
        ],
      },
      {
        name: "高知県",
        hiragana: "？？",
        cities: [
          { name: "高知市", hiragana: "？？" },
          { name: "南国市", hiragana: "？？" },
        ],
      },
    ],
  },

  // 九州・沖縄地方
  {
    name: "九州・沖縄",
    hiragana: "？？",
    prefectures: [
      {
        name: "福岡県",
        hiragana: "？？",
        cities: [
          { name: "福岡市", hiragana: "？？" },
          { name: "北九州市", hiragana: "？？" },
          { name: "久留米市", hiragana: "？？" },
        ],
      },
      {
        name: "佐賀県",
        hiragana: "？？",
        cities: [
          { name: "佐賀市", hiragana: "？？" },
          { name: "唐津市", hiragana: "？？" },
        ],
      },
      {
        name: "長崎県",
        hiragana: "？？",
        cities: [
          { name: "長崎市", hiragana: "？？" },
          { name: "佐世保市", hiragana: "？？" },
        ],
      },
      {
        name: "熊本県",
        hiragana: "？？",
        cities: [
          { name: "熊本市", hiragana: "？？" },
          { name: "八代市", hiragana: "？？" },
        ],
      },
      {
        name: "大分県",
        hiragana: "？？",
        cities: [
          { name: "大分市", hiragana: "？？" },
          { name: "別府市", hiragana: "？？" },
        ],
      },
      {
        name: "宮崎県",
        hiragana: "？？",
        cities: [
          { name: "宮崎市", hiragana: "？？" },
          { name: "都城市", hiragana: "？？" },
        ],
      },
      {
        name: "鹿児島県",
        hiragana: "？？",
        cities: [
          { name: "鹿児島市", hiragana: "？？" },
          { name: "霧島市", hiragana: "？？" },
        ],
      },
      {
        name: "沖縄県",
        hiragana: "？？",
        cities: [
          { name: "那覇市", hiragana: "？？" },
          { name: "沖縄市", hiragana: "？？" },
          { name: "浦添市", hiragana: "？？" },
        ],
      },
    ],
  },
];
