import {
  BookOpen,
  Bug,
  Building2,
  CircleAlert,
  ClipboardCheck,
  Compass,
  Filter,
  Fish,
  History,
  Lightbulb,
  Lock,
  Mail,
  Megaphone,
  Search,
  Shield,
  Sprout,
  TreePine,
  Waves,
} from "lucide-react";

// デザインモックで共通の白カードとして使われるスタイル
const CARD_CLASS =
  "rounded-[20px] border border-[#85A928]/25 bg-white p-6 shadow-[0_4px_20px_rgba(120,140,100,0.08)] md:p-10";

// カード内のセクション見出し（左端に緑の縦バーを伴う）
function SectionTitle({
  children,
  center = false,
}: Readonly<{ children: React.ReactNode; center?: boolean }>) {
  return (
    <h2
      className={`mb-6 flex items-center gap-3 text-[26px] font-bold text-[#2D401A] ${center ? "justify-center" : ""}`}
    >
      <span className="h-7 w-1.5 shrink-0 rounded-[3px] bg-[#85A928]" />
      {children}
    </h2>
  );
}

// 各セクションの上部に置くピル型バッジ
function SectionBadge({
  icon: Icon,
  children,
}: Readonly<{ icon: typeof Compass; children: React.ReactNode }>) {
  return (
    <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#D4E3B3] bg-[#EEF5DF] px-4 py-1.5 text-[13px] font-bold tracking-[0.02em] text-[#5C781E]">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}

// 左に緑の縁を付けた強調帯
function HighlightBanner({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex items-center gap-2 rounded-r-xl border-l-4 border-[#85A928] bg-[#EEF5DF] px-5 py-4 text-base font-bold text-[#3B5220]">
      {children}
    </div>
  );
}

// 「サービスの特徴」の4カード共通のレイアウト
function FeatureCard({
  icon: Icon,
  title,
  description,
}: Readonly<{
  icon: typeof Search;
  title: string;
  description: string;
}>) {
  return (
    <div className="flex items-start gap-[18px] rounded-2xl border border-[#E2EBD3] bg-[#FCFDFA] p-6">
      <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#EEF5DF] text-[#72961D]">
        <Icon className="size-[22px]" />
      </span>
      <div>
        <h3 className="mb-1.5 text-lg font-bold text-[#2D401A]">{title}</h3>
        <p className="text-[14.5px] leading-[1.6] text-[#55634C]">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto mt-6 w-full max-w-[920px] space-y-8">
      {/* ヒーローセクション */}
      <section
        className={`${CARD_CLASS} bg-gradient-to-b from-white to-[#F9FBF5] px-5 py-10 text-center md:px-10 md:py-[60px]`}
      >
        <SectionBadge icon={Compass}>コンセプト</SectionBadge>
        <h1 className="mb-3 text-[28px] font-black tracking-[0.02em] text-[#2D401A] md:text-[38px]">
          なちゅいべとは
        </h1>
        <div className="inline-block rounded-[30px] bg-[#EEF5DF] px-5 py-1.5 text-lg font-bold text-[#618218] md:px-7 md:py-2 md:text-[22px]">
          生態系を守り、未来へ繋ぐ
        </div>
      </section>

      {/* 課題背景セクション */}
      <section className={CARD_CLASS}>
        <SectionBadge icon={Sprout}>背景</SectionBadge>
        <SectionTitle>見つけられないイベントが、たくさんある</SectionTitle>
        <p className="text-base leading-[1.8] text-[#333]">
          生き物のイベントは、日本各地で毎週のように開かれています。
        </p>
        <div className="my-4 flex flex-wrap gap-2.5">
          {[
            { icon: Fish, label: "川の生きもの観察会" },
            { icon: Waves, label: "干潟の調査" },
            { icon: Bug, label: "外来種の防除作業" },
            { icon: TreePine, label: "里山の草刈り" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-lg border border-[#DCE8C8] bg-[#F2F7E9] px-4 py-1.5 text-sm font-medium text-[#4A6322]"
            >
              <Icon className="size-3.5" />
              {label}
            </span>
          ))}
        </div>
        <p className="text-base leading-[1.8] text-[#333]">
          けれど、その情報はSNSや団体のホームページ、公民館のチラシに散らばっています。
          <br />
          探そうと思っても、どこを見ればいいのか分からない。結局、団体に所属している人や、たまたま知り合いがいた人にしか届いていません。
        </p>
        <div className="my-5 rounded-[14px] border border-dashed border-[#C8D9AB] bg-[#FAFBF7] p-6">
          <ul className="flex flex-col gap-3">
            {[
              "参加したい人は、イベントを見つけられない。",
              "主催者は、参加者を集められない。",
              "そして保全の現場では、人手が足りないままです。",
            ].map((text) => (
              <li
                key={text}
                className="flex items-start gap-3 text-base font-bold text-[#3B5220]"
              >
                <CircleAlert className="mt-[3px] size-[18px] shrink-0 text-[#D97706]" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <HighlightBanner>
          <Lightbulb className="size-4 shrink-0" />
          関心がないから参加しないのではありません。入口が見つからないだけです。
        </HighlightBanner>
      </section>

      {/* ソリューション（4つの機能特徴） */}
      <section className={CARD_CLASS}>
        <SectionBadge icon={Compass}>サービスの特徴</SectionBadge>
        <SectionTitle>散らばったイベントを、ひとつに。</SectionTitle>
        <p className="mb-6 text-base text-[#55634C]">
          なちゅいべは、生き物に関わるイベントを一箇所に集めるサイトです。
        </p>
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <FeatureCard
            icon={Search}
            title="探せる"
            description="全国のイベントを、ひとつの一覧から"
          />
          <FeatureCard
            icon={Filter}
            title="選べる"
            description="日付や場所、はじめての人向けかどうかで絞り込める"
          />
          <FeatureCard
            icon={ClipboardCheck}
            title="分かる"
            description="持ち物も費用も当日の流れも、申し込む前に"
          />
          <FeatureCard
            icon={Megaphone}
            title="届く"
            description="個人でも団体でも、関心のある人にまっすぐ"
          />
        </div>
        <div className="rounded-[14px] bg-[#EEF5DF] p-5 text-center text-[17px] font-bold text-[#2D401A]">
          つながりがなくても、関心さえあれば見つけられる。見つけてから参加するまでを、まっすぐにします。
        </div>
      </section>

      {/* 2カラムセクション（記録＆保護） */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col rounded-[20px] border border-[#85A928]/25 bg-white p-6 shadow-[0_4px_20px_rgba(120,140,100,0.08)] md:p-8">
          <SectionBadge icon={BookOpen}>活動レポート</SectionBadge>
          <h3 className="mb-3.5 flex items-center gap-2.5 text-xl font-bold text-[#2D401A]">
            <History className="size-5 text-[#85A928]" />
            記録を、次につなげる
          </h3>
          <p className="mb-3 text-[15px] text-[#4A5542]">
            イベントが終わったら、主催者がレポートを残せます。
          </p>
          <p className="mb-3 text-[15px] text-[#4A5542]">
            その日どんな生き物に出会ったのか、何人が集まったのか。ひとつひとつは小さな記録ですが、積み重なれば活動の成果を示すものになります。次に参加する人にとっては、どんな会なのかを知る手がかりにもなります。
          </p>
          <div className="mt-auto pt-4">
            <HighlightBanner>
              <span className="text-[14.5px]">
                やって終わりにしない。それがなちゅいべの目標です。
              </span>
            </HighlightBanner>
          </div>
        </section>

        <section className="flex flex-col rounded-[20px] border border-[#85A928]/25 bg-white p-6 shadow-[0_4px_20px_rgba(120,140,100,0.08)] md:p-8">
          <SectionBadge icon={Shield}>生態系の保護</SectionBadge>
          <h3 className="mb-3.5 flex items-center gap-2.5 text-xl font-bold text-[#2D401A]">
            <Sprout className="size-5 text-[#85A928]" />
            希少な生き物のいる場所は、公開しません
          </h3>
          <p className="mb-3 text-[15px] text-[#4A5542]">
            イベント情報を広く届けることと、生き物を守ることは、ときにぶつかります。
          </p>
          <p className="mb-3 text-[15px] text-[#4A5542]">
            珍しい植物の自生地や繁殖地の正確な位置が広まれば、盗掘や乱獲を招きます。だからなちゅいべでは、公開する場所の細かさを主催者が選べるようにしています。市区町村までしか出さない、という選び方もできます。
          </p>
          <div className="mt-auto pt-4">
            <p className="flex items-center gap-2 rounded-lg border border-[#D4E3B3] bg-[#F4F8EC] px-3.5 py-2.5 text-[14.5px] font-bold text-[#2D401A]">
              <Lock className="size-4 shrink-0 text-[#85A928]" />
              詳しい集合場所は、参加が決まった方にお伝えします。
            </p>
          </div>
        </section>
      </div>

      {/* 運営情報カード */}
      <section className={`${CARD_CLASS} text-center`}>
        <SectionBadge icon={Building2}>運営情報</SectionBadge>
        <SectionTitle center>運営について</SectionTitle>
        <p className="mt-2 text-[17px] font-bold text-[#2D401A]">
          なちゅいべは、NatuPortal が運営しています。
        </p>
        <div className="my-5 inline-flex flex-col items-center gap-1.5 rounded-2xl border border-[#D4E3B3] bg-[#F4F8EC] px-5 py-4 text-base text-[#2D401A] sm:flex-row sm:gap-3 sm:rounded-[50px] sm:px-8">
          <span className="flex items-center gap-2 font-bold text-[#4A5542]">
            <Mail className="size-4 text-[#85A928]" />
            お問い合わせ
          </span>
          <a
            href="mailto:natuive-info@natuportal.org"
            className="font-bold text-[#618218] hover:underline"
          >
            natuive-info@natuportal.org
          </a>
        </div>
      </section>
    </div>
  );
}
