# ADR-0005: CSP に nonce と `'strict-dynamic'` を使い、全ページの動的レンダリングを受け入れる

- ステータス: Accepted
- 日付: 2026-11-13
- 関連: #335, #383, #407, #412, #413, #414, #415, #416, #418, #419, ADR-0001

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

- OpenNext の incremental cache は既定の `dummy` のまま（`open-next.config.ts` で設定していない）。本番でも `x-nextjs-cache: MISS` で、
  静的ページを含めて毎回描画している。`event/[id]` の `revalidate = 60` も効いていない。
- OpenNext Cloudflare 1.20.13 は Node 用の middleware（`src/proxy.ts`）を実験的に扱える。#418 を main に重ねたローカルの `preview` で、
  ページの応答に nonce の CSP が付き、HTML の `<script>` に同じ nonce が付くことを確かめた。
- Workers Paid の料金（[公式](https://developers.cloudflare.com/workers/platform/pricing/)）: 月 $5。リクエスト 月 1,000 万件・CPU 月 3,000 万ミリ秒を含み、
  超過はリクエスト 100 万件あたり $0.30、CPU 100 万ミリ秒あたり $0.02。静的ファイルは無料。

## 決定

**CSP の `script-src` を nonce と `'strict-dynamic'` で組み立て、`'unsafe-inline'` を使わない。
そのために全ページを動的レンダリングにし、HTML のキャッシュ（ISR・静的ページ・エッジのキャッシュ）を使わないことを受け入れる。**
#335（#419）の「nonce を使う CSP は見送る」は、この ADR で取り消す。

1. nonce の CSP は `src/proxy.ts` がリクエストごとに nonce を作って付け、中身は `src/lib/csp.ts` で組み立てる（#413）。
   画像の取得元は `next.config.ts` の `remotePatterns` と同じ一覧から作り、#335 の CSP と許可先がずれないようにする。
2. 本番で nonce の CSP を有効（enforce）にするのは #412 とする。それまでは #335 の CSP を enforce のまま残し、
   nonce の CSP は本番・検証環境とも `Content-Security-Policy-Report-Only` で付ける（#418 の `CSP_REPORT_ONLY=true`。違反の観察は #416）。
   #418 をそのままマージすると次の本番デプロイで nonce の CSP が enforce になるため、本番のビルドでも Report-Only にしてから出す。
3. #412 で nonce の CSP を enforce に切り替え、`next.config.ts` の CSP を外す。以後、CSP を付けるのは proxy だけにする。
   ローカルの `preview` では proxy の CSP が `next.config.ts` の CSP を置き換えたが、OpenNext のヘッダーの合成に頼らないよう、定義を 1 か所にする。
4. 開発時（`next dev`）も CSP を付け、`'unsafe-eval'`（React の開発版）・HMR 用の `ws:`/`wss:`・MSW 用の `worker-src 'self'` だけを足す（#413 の AC）。
   本番と検証環境は同じ CSP で、接続先と画像の取得元だけがビルド時の環境変数で変わる。
5. `X-Frame-Options`・`X-Content-Type-Options`・`Referrer-Policy` は #335 のまま（`next.config.ts` と `public/_headers`）。
6. Trusted Types（`require-trusted-types-for`）は #415 で判断し、この ADR では決めない。
7. 次のいずれかに当てはまったら、この決定を見直す。
   - 表示速度（LCP など）の目標を設け、HTML のキャッシュが必要になったとき
   - 月の CPU 時間が Workers Paid に含まれる量（3,000 万ミリ秒）を超え続けるとき
   - OpenNext が Node 用の middleware を扱えなくなるなどで、proxy を保てなくなったとき

## 理由

- **今の費用と速度は悪くならない**: 本番は今も毎回描画しているため、動的レンダリングにしても描画の回数は増えない。
  ローカルの `preview` で main と main + #418 を比べると、HTML を受け取り終えるまでの時間は #418 のほうが 18〜47 ms 短かった（表 1）。
  静的ページで毎回 `dummy` のキャッシュを引いてから描画する処理がなくなるためと考えられる。proxy の分の CPU 時間は測っていない。
- **失うのは将来の高速化の余地で、その大きさは受け入れられる**: 本番の HTML を静的ファイル並みに返せたとすると、
  1 ページあたり約 0.03〜0.19 秒速くなる（表 2）。速い回線での表示完了（LCP、約 0.7〜0.8 秒）の 3〜28%、
  遅いモバイル回線を模した Lighthouse の条件（約 3.8〜4.3 秒）の 1〜4% にあたる。
  遅い回線での LCP の約 85% は JavaScript の処理と通信の待ちで、HTML のキャッシュでは縮まない。
- **`'unsafe-inline'` では、HTML を差し込まれるとインラインのスクリプトや `onerror` などが動く**: nonce ならこれらを止められる。
  今の XSS の入口は小さい（`dangerouslySetInnerHTML` は 0 件、外部 URL はスキームを検査）が、将来のミスや依存ライブラリの不具合に備えられる。
  CSP では持ち出し（`connect-src` のワイルドカード、ページの遷移）を塞ぎきれないため、スクリプトを実行させないことに価値がある。
- **#383 の AC と #407 の目標に合う**: HTTP Observatory の採点表（2024-02 時点）では `'unsafe-inline'` が −20 点で、
  B+（80 点）に届くには、ほかの項目がすべて減点なしである必要がある。
- **データのキャッシュは nonce と両立する**: `unstable_cache` のようにデータだけを保存するキャッシュは nonce を含まないため、
  incremental cache を設定すれば使える。イベント詳細の API の負荷を下げたくなったときは、こちらで対応する。

表 1: ローカルの `preview`（2026-11-13。MSW なし。各ページ 5 回空打ちしてから 30 回測った中央値。接続後から受信完了まで）

| ページ | main | main + #418 | 差 |
|---|---|---|---|
| `/about` | 59 ms | 24 ms | −35 ms |
| `/guideline` | 79 ms | 32 ms | −47 ms |
| `/event-list` | 54 ms | 24 ms | −31 ms |
| `/signin` | 38 ms | 21 ms | −18 ms |
| `/event/[id]`（本番の API を呼ぶ） | 123 ms | 104 ms | −19 ms |

表 2: 本番（2026-11-13。関西の拠点。接続後から応答開始まで、中央値）

| ページ | 連続 20 回 | 約 1 分おき 12 回 | 静的ファイル並みに返せた場合に縮む時間 |
|---|---|---|---|
| `/about` | 106 ms | 83 ms | 約 45〜65 ms |
| `/guideline` | 154 ms | ― | 約 110 ms |
| `/event-list` | 67 ms | 123 ms | 約 25〜80 ms |
| `/event/[id]` | 149 ms | 226 ms | 約 110〜190 ms |

- 「静的ファイル並み」は、Cloudflare のキャッシュから返る `/images/og-default.png`（`cf-cache-status: HIT`）の 36〜42 ms を目安にした。
- 長くアクセスがなかった後の初回は、接続を含めて 1.2〜1.4 秒かかった例が 2 回あった。エッジのキャッシュならこれを避けられる可能性があるが、
  起きる頻度は測っていない（約 1 分おきのアクセスでは起きなかった）。
- 測った場所は 1 か所で、Lighthouse は各ページ 1 回。

## 影響（結果）

### 良い影響

- 差し込まれたインラインのスクリプト・イベントハンドラ・`javascript:` の URL が動かなくなる。
- #383 の AC（`'unsafe-inline'`・`'unsafe-eval'` を含めない）と #407 の目標を満たしやすくなる。
- 静的ページで `dummy` のキャッシュを引く処理がなくなり、ローカルでは応答が短くなった（本番での差は検証環境で確かめる）。

### トレードオフ・制約

- HTML のキャッシュ（ISR・静的ページ・Workers Cache）と PPR を使えない。表示速度を上げる手段は、JavaScript の削減・データのキャッシュ・画像の最適化などに限られる。
- 全ページが proxy（OpenNext の実験的な Node 用の middleware）を通る。proxy が壊れると全ページが表示できなくなるため、
  OpenNext を上げるときは検証環境で CSP と表示を確かめてから本番に出す。戻すときは #418 の変更を revert する。
- proxy の分の CPU 時間は測っていない。検証環境で確かめる。
- `_global-error` はビルド時に作られるため nonce が付かない（#418）。
- `style-src` には `'unsafe-inline'` が残る（`next/image` の `style` 属性・sonner が差し込む `<style>` など）。
- 違反の報告先（`report-to`）はなく、違反は DevTools のコンソールで確かめる（#416）。
- `connect-src` の `https://*.r2.cloudflarestorage.com` は持ち出し先になりうる。#335 で「`'unsafe-inline'` の下では絞っても効果が小さい」として
  先送りしたため、#412 で nonce の CSP を有効にするときに絞るかを改めて決める。

## 検討した代替案

- **#335 のまま `'unsafe-inline'` を使う**: 将来 HTML のキャッシュを使えるが、差し込まれたインラインのスクリプトを止められず、#383 の AC を満たせない。
  HTML のキャッシュを使う計画は今なく、手放すもの（1 ページあたり約 0.03〜0.19 秒）に比べて守れるものが小さい。不採用。
- **ログインや投稿の画面だけ nonce にする**: localStorage はオリジン単位で共有されるため、攻撃者は nonce のないページを狙えば同じトークンを読める。不採用。
- **ハッシュ方式（Next.js の `experimental.sri`）**: 静的生成のまま厳しい CSP にできると Next.js のガイドにあるが、実験的な機能で、
  App Router がページに埋め込むインラインスクリプトまで許可できるかは確かめていない。不採用（必要になったら試作して判断する）。
- **Trusted Types だけを足す**: DOM 経由の XSS（`innerHTML` など）は止められるが、差し込まれたインラインのスクリプトは止められない。
  nonce と組み合わせるかは #415 で判断する。
