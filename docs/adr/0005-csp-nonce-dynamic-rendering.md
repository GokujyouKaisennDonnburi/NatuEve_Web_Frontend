# ADR-0005: CSP に nonce と `'strict-dynamic'` を使い、全ページの動的レンダリングを受け入れる

- ステータス: Accepted
- 日付: 2026-11-13
- 関連: #335, #383, #407, #412, #413, #414, #415, #416, #418, #419, ADR-0001, ADR-0003

## コンテキストと課題

PBI79 の不安は、偽の画面や通信の盗み見でアカウントを乗っ取られること。Supabase のセッションは localStorage に保存しているため
（`src/lib/supabase.ts` の `persistSession: true`）、ページで任意のスクリプトが動けばトークンを持ち出せる。

CSP の `script-src` について、2 つの判断がぶつかっていた。

- #383 の AC: `'unsafe-inline'`・`'unsafe-eval'` を含めず、必要なスクリプトは nonce などで許可する。
  #413（#418）で、nonce と `'strict-dynamic'` を `src/proxy.ts` で付ける実装を進めていた。
- #335（#419）: `script-src 'self' 'unsafe-inline'` とし、nonce は見送った。理由は「全ページが毎回の動的レンダリングになり、
  ISR・静的ページを使えない」「OpenNext は Node 用の middleware に対応していない」の 2 つ。

nonce は応答ごとに変える必要があるため、使うと全ページが動的レンダリングになり、HTML をキャッシュして配れなくなる
（Next.js 同梱のガイド `01-app/02-guides/content-security-policy.md`）。この費用と表示速度への影響を受け入れるかを決める。

前提（2026-11-13 に確認）:

- OpenNext の incremental cache は既定の `dummy` のまま（`open-next.config.ts` で設定していない）。本番の応答は静的ページも `x-nextjs-cache: MISS` で、
  キャッシュを使わずに毎回描画している。`event/[id]` の `revalidate = 60` も効いていない。
- OpenNext Cloudflare 1.20.13 は Node 用の middleware（`src/proxy.ts`）を実験的に扱える。ADR-0001 の「Node 用の middleware には対応していない」は、
  この版では当てはまらない。#418 を main に重ねたローカルの `preview` で、ページの応答に nonce の CSP が付き、HTML の `<script>` に同じ nonce が付くことを確かめた。
- OpenNext が Worker の実行時に `process.env` へ入れるのは、`.env` ファイルの値（ビルド時に `next-env.mjs` へ書き出す）と Worker の vars・secrets だけ。
  CI は `.env` ファイルを使わず、`wrangler.jsonc` に `vars` もないため、ワークフローの `env:` に書いた値は proxy の実行時には届かない
  （ビルド時に埋め込まれる `NEXT_PUBLIC_*` と、ビルド時に評価される `next.config.ts` は別）。
- Workers Paid の料金（[公式](https://developers.cloudflare.com/workers/platform/pricing/)）: 月 $5。リクエスト 月 1,000 万件・CPU 月 3,000 万ミリ秒を含み
  （アカウント全体。検証環境などほかの Worker と共有する）、超過はリクエスト 100 万件あたり $0.30、CPU 100 万ミリ秒あたり $0.02。静的ファイルは無料。

## 決定

**CSP の `script-src` を nonce と `'strict-dynamic'` で組み立て、`'unsafe-inline'` を使わない。
そのために全ページを動的レンダリングにし、HTML のキャッシュ（ISR・静的ページ・エッジのキャッシュ）を使わないことを受け入れる。**
#335（#419）の「nonce を使う CSP は見送る」は、この ADR で取り消す。

1. nonce の CSP は `src/proxy.ts` がリクエストごとに nonce を作って付け、中身は `src/lib/csp.ts` で組み立てる（#413）。
   画像の取得元は `next.config.ts` の `remotePatterns` と同じ一覧から作る。一覧は別のモジュールに切り出して両方から使う
   （`next.config.ts` はモジュールの読み込み時に `initOpenNextCloudflareForDev()` を呼ぶため、proxy からは import しない）。切り出せない場合は、一致を確かめるテストを置く。
2. 本番で nonce の CSP を有効（enforce）にするのは #412 とする。それまでは #335 の CSP を enforce のまま残し、
   nonce の CSP は本番・検証環境とも `Content-Security-Policy-Report-Only` で付ける（#418 の `CSP_REPORT_ONLY=true`。違反の観察は #416）。
   - 動的レンダリングは、Report-Only の間も #418 を本番に出した時点から全ページで始まる（root layout の `connection()`）。
     本番を Report-Only にするのは、違反の解消（#416）が終わる前に、本番でスクリプトを止めないため。
   - proxy が実行時に読む値（`CSP_REPORT_ONLY`・`USE_DEV_ASSETS`・`NEXT_PUBLIC_USE_MSW`）は、上の前提のとおり CI の `env:` では届かない。
     #413 で実行時に渡す経路（`wrangler.jsonc` の `vars` など）を決める。届かないと `CSP_REPORT_ONLY` は未設定として読まれ、#418 の既定の enforce になる。
   - 本番に出す前に、検証環境で `curl -I` を取り、ページの応答のヘッダー名が `content-security-policy-report-only` であることと、
     検証環境の CSP に `https://assets-dev.natuportal.org` が入っていることを確かめる。
3. #412 で nonce の CSP を enforce に切り替え、`next.config.ts` の CSP を外す。以後、CSP を付けるのは proxy だけにする。
   - ローカルの `preview` では、proxy の CSP が `next.config.ts` の CSP を置き換えた。OpenNext のヘッダーの合成に頼らないよう、定義を 1 か所にする。
   - proxy を通らないパス（`robots.txt`・`sitemap.xml`・`favicon.ico`・`/api`・先読みのリクエスト）には CSP が付かなくなる。HTML ではないため受け入れる。
4. 開発時（`next dev`）も CSP を付け、`'unsafe-eval'`（React の開発版）・HMR 用の `ws:`/`wss:`・MSW 用の `worker-src 'self'` だけを足す（#413 の AC）。
   本番と検証環境は同じ CSP で、接続先と画像の取得元だけが環境ごとの値で変わる。
5. `X-Frame-Options`・`X-Content-Type-Options`・`Referrer-Policy` は #335 のまま（`next.config.ts` と `public/_headers`）。
6. Trusted Types（`require-trusted-types-for`）を入れるかと、許可するポリシー名は #415 で決める。入れる場合も、開発時は無効にする（#415 の AC）。
7. HTML をキャッシュする設定（Cloudflare の Cache Rules・Workers Cache・OpenNext の incremental cache の HTML）は足さない。
   キャッシュした HTML を配ると、全員に同じ nonce が渡って意味がなくなる。データだけのキャッシュ（`unstable_cache`）は使ってよい。
8. 次のいずれかに当てはまったら、この決定を見直す。
   - 検証環境で、初回表示・ページ間の移動・CPU 時間を #418 の前後で測り、受け入れた範囲（下の「理由」）より悪くなったとき
   - 表示速度（LCP など）の目標を設け、HTML のキャッシュが必要になったとき
   - アカウント全体の CPU 時間が、Workers Paid に含まれる量（月 3,000 万ミリ秒）を超え続けるとき
   - OpenNext が Node 用の middleware を扱えなくなるなどで、proxy を保てなくなったとき

## 理由

- **`'unsafe-inline'` では、HTML を差し込まれるとインラインのスクリプトや `onerror` などが動く**: nonce ならこれらを止められる。
  今の XSS の入口は小さい（`dangerouslySetInnerHTML` は 0 件、外部 URL はスキームを検査）が、将来のミスや依存ライブラリの不具合に備えられる。
  CSP では持ち出し（`connect-src` のワイルドカード、ページの遷移）を塞ぎきれないため、スクリプトを実行させないことに価値がある。
- **`'strict-dynamic'` を足すのは、Next.js が後から読み込むスクリプトを許可するため**: `'strict-dynamic'` は、nonce の付いたスクリプトが
  読み込んだスクリプトも信頼する。実行時に足される `<script>` に nonce が届かなくても動き、Next.js のガイドの例も nonce と組み合わせている。
  対応するブラウザでは `'self'` などの許可リストは無視され、対応しない古いブラウザには `'self'` が効く（#418 の `src/lib/csp.ts`）。
  信頼したスクリプトが読み込むものは何でも通るため、nonce を付けるのは Next.js が出力するスクリプトだけにする。
- **初回表示と費用は、測った範囲では悪くならない**: 本番は今もキャッシュを使わずに毎回描画しているため、動的レンダリングにしても描画の回数は増えない。
  ローカルの `preview` で main と main + #418 を比べると、HTML を受け取り終えるまでの時間は #418 のほうが 17〜47 ms 短かった（表 1）。
  静的ページで毎回 `dummy` のキャッシュを引いてから描画する処理がなくなるためと考えられる。
  本番での差・proxy の分の CPU 時間は測っていないため、検証環境で確かめる（決定 8）。
- **ページ間の移動は遅くなる。その大きさは受け入れられる**: Next.js は、画面に入った `<Link>` の先のうち静的なページを先読みし、
  動的なページは `loading.js` がなければ先読みしない（同梱のガイド `01-app/02-guides/prefetching.md`）。`src/app` に `loading.tsx` はない。
  - #418 の後は、ヘッダーやフッターから固定ページなどへ移るとき、クリックしてからサーバーの応答を待つ。
    今の本番の RSC の応答は 0.15〜0.2 秒（表 3）で、待ち時間はおよそこの分増える（#418 の後の値は測っていない）。
  - イベント一覧のカードからイベント詳細への移動は、もともと先読みしていない（`EventCard` の `prefetch={false}`）ため変わらない。
  - 待ちが気になる場合は、`loading.tsx` を置いて先読みと読み込み中の表示を戻せる。
- **失う将来の高速化の余地は受け入れられる**: 本番の HTML を静的ファイル並みに返せたとすると、1 ページあたり約 0.03〜0.19 秒速くなる（表 2）。
  ページごとに計算すると、速い回線での表示完了（LCP、0.69〜0.78 秒）の 3〜28%、遅いモバイル回線を模した Lighthouse の条件（3.8〜4.3 秒）の 1〜4% にあたる。
  遅い回線の条件では、LCP の約 85% が LCP の要素を描画するまでの待ち（Lighthouse の Render Delay）で、HTML のキャッシュで縮むのは HTML の応答の分だけである。
- **#383 の AC と #407 の目標に合う**: HTTP Observatory の現行の採点（[mdn/mdn-http-observatory の `src/grader/charts.js`](https://github.com/mdn/mdn-http-observatory/blob/main/src/grader/charts.js)）では、
  `script-src` の `'unsafe-inline'` が −20 点で、B+ は 80 点から。HSTS がないとさらに −20 点になる。
  Report-Only の CSP しかない場合は −25 点（CSP なしと同じ）になるため、#407 の再スキャンは #412 の後に行う。
- **データのキャッシュは nonce と両立する**: `unstable_cache` のようにデータだけを保存するキャッシュは nonce を含まないため、
  incremental cache を設定すれば使える。イベント詳細の API の負荷を下げたくなったときは、こちらで対応する。

表 1: ローカルの `preview`（2026-11-13。MSW なし。各ページ 5 回空打ちしてから 30 回測った中央値。接続後から受信完了まで。差は表の値から計算）

| ページ | main | main + #418 | 差 |
|---|---|---|---|
| `/about` | 59 ms | 24 ms | −35 ms |
| `/guideline` | 79 ms | 32 ms | −47 ms |
| `/event-list` | 54 ms | 24 ms | −30 ms |
| `/signin` | 38 ms | 21 ms | −17 ms |
| `/event/[id]`（本番の API を呼ぶ） | 123 ms | 104 ms | −19 ms |

表 2: 本番の HTML（2026-11-13。関西の拠点。接続後から応答開始まで、中央値）

| ページ | 連続 20 回 | 約 1 分おき 12 回 | 静的ファイル並みに返せた場合に縮む時間 |
|---|---|---|---|
| `/about` | 106 ms | 83 ms | 約 40〜70 ms |
| `/guideline` | 154 ms | ― | 約 110〜120 ms |
| `/event-list` | 67 ms | 123 ms | 約 25〜85 ms |
| `/event/[id]` | 149 ms | 226 ms | 約 105〜190 ms |

- 縮む時間は「左の 2 列の値 − 静的ファイルの値（36〜42 ms）」の範囲。静的ファイルは、Cloudflare のキャッシュから返る `/images/og-default.png`（`cf-cache-status: HIT`）。
- 長くアクセスがなかった後の初回は、接続を含めて 1.2〜1.4 秒かかった例が 2 回あった。エッジのキャッシュならこれを避けられる可能性があるが、
  起きる頻度は測っていない（約 1 分おきのアクセスでは起きなかった）。
- LCP は Lighthouse 12.8.2（モバイル、`/about`・`/event-list`・`/event/[id]` を各 1 回）。速い回線の値は同じ実行の制限なしの実測値。測った場所は 1 か所。

表 3: 本番の RSC（ページ間の移動で取得するデータ。2026-11-13。各 10 回の中央値。接続後から受信完了まで）

| ページ | 応答 |
|---|---|
| `/about` | 148 ms |
| `/guideline` | 196 ms |
| `/event-list` | 152 ms |
| `/event/[id]` | 181 ms |

## 影響（結果）

### 良い影響

- 差し込まれたインラインのスクリプト・イベントハンドラ・`javascript:` の URL が動かなくなる。
- #383 の AC（`'unsafe-inline'`・`'unsafe-eval'` を含めない）と #407 の目標を満たしやすくなる。
- 静的ページで `dummy` のキャッシュを引く処理がなくなり、ローカルでは応答が短くなった（本番での差は検証環境で確かめる）。
- 静的なページの先読みがなくなるため、先読みのリクエストは減る見込み（件数は測っていない）。

### トレードオフ・制約

- HTML のキャッシュ（ISR・静的ページ・Workers Cache）と PPR を使えない。表示速度を上げる手段は、JavaScript の削減・データのキャッシュ・画像の最適化などに限られる。
- ヘッダーやフッターからの移動で、クリック後にサーバーの応答を待つようになる（上の「理由」）。
- 全ページが proxy（OpenNext の実験的な Node 用の middleware）を通る。proxy が壊れると全ページが表示できなくなるため、
  OpenNext を上げるときは検証環境で CSP と表示を確かめてから本番に出す。
- 戻すときは、#412 の前なら #418 の変更を revert する。#412 の後は `next.config.ts` の CSP を外しているため、#412 の変更も一緒に戻す。
- proxy の分の CPU 時間は測っていない。検証環境で確かめる（決定 8）。
- `_global-error` はビルド時に作られるため nonce が付かない（#418）。
- `style-src` には `'unsafe-inline'` が残る（`next/image` の `style` 属性・sonner が差し込む `<style>` など）。Observatory の採点では減点されない。
- 違反の報告先（`report-to`）はなく、違反は DevTools のコンソールで確かめる（#416）。
- `connect-src` の `https://*.r2.cloudflarestorage.com` は持ち出し先になりうる。#335 で「`'unsafe-inline'` の下では絞っても効果が小さい」として
  先送りしたため、#412 で nonce の CSP を有効にするときに絞るかを改めて決める。
- この ADR の決定 2・3 は #412・#413 の AC に書かれていないため、各 issue の AC に反映する。

## 検討した代替案

- **#335 のまま `'unsafe-inline'` を使う**: 将来 HTML のキャッシュを使えるが、差し込まれたインラインのスクリプトを止められず、#383 の AC を満たせない。
  HTML のキャッシュを使う計画は今なく、手放すもの（1 ページあたり約 0.03〜0.19 秒）に比べて守れるものが小さい。不採用。
- **ログインや投稿の画面だけ nonce にする**: localStorage はオリジン単位で共有されるため、攻撃者は nonce のないページを狙えば同じトークンを読める。不採用。
- **ハッシュ方式（Next.js の `experimental.sri`）**: 静的生成のまま厳しい CSP にできると Next.js のガイドにあるが、実験的な機能で、
  App Router がページに埋め込むインラインスクリプトまで許可できるかは確かめていない。不採用（必要になったら試作して判断する）。
- **キャッシュした HTML の nonce を、応答ごとにエッジで書き換える**: HTML のキャッシュと nonce を両立できる可能性があるが、
  Next.js が HTML と RSC のどこに nonce を書くかを含め調べていない。今は HTML のキャッシュが要らないため見送り、必要になったときに調べる。
- **Trusted Types だけを足す**: DOM 経由の XSS（`innerHTML` など）は止められるが、差し込まれたインラインのスクリプトは止められない。
  nonce と組み合わせるかは #415 で判断する。
