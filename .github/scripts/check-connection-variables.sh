#!/usr/bin/env bash
# デプロイのジョブで、ビルドの前に接続先の変数が期待値どおりかを確かめる（#330・#362。docs/Deployment.md「CI/CD」）。
# Environment に変数を定義し忘れると同じ名前のリポジトリの Variables が使われるため、期待値は変数から取らずにワークフローに書いて渡す。
#
# 使う環境変数:
#   DEPLOY_ENVIRONMENT        Environment の名前（staging・production）。エラーメッセージに使う
#   EXPECTED_API_BASE_URL     NEXT_PUBLIC_API_BASE_URL の期待値
#   EXPECTED_SUPABASE_URL     NEXT_PUBLIC_SUPABASE_URL の期待値
#   NEXT_PUBLIC_API_BASE_URL・NEXT_PUBLIC_SUPABASE_URL・NEXT_PUBLIC_SUPABASE_ANON_KEY・CLOUDFLARE_ACCOUNT_ID  確かめる値
set -euo pipefail

: "${DEPLOY_ENVIRONMENT:?}" "${EXPECTED_API_BASE_URL:?}" "${EXPECTED_SUPABASE_URL:?}"
NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-}"
NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
hint="${DEPLOY_ENVIRONMENT} Environment の Variables を確認してください。"

failed=0
if [ "$NEXT_PUBLIC_API_BASE_URL" != "$EXPECTED_API_BASE_URL" ]; then
  echo "::error::NEXT_PUBLIC_API_BASE_URL が ${EXPECTED_API_BASE_URL} ではありません（実際: ${NEXT_PUBLIC_API_BASE_URL:-未設定}）。${hint}"
  failed=1
fi
if [ "$NEXT_PUBLIC_SUPABASE_URL" != "$EXPECTED_SUPABASE_URL" ]; then
  echo "::error::NEXT_PUBLIC_SUPABASE_URL が ${EXPECTED_SUPABASE_URL} ではありません（実際: ${NEXT_PUBLIC_SUPABASE_URL:-未設定}）。${hint}"
  failed=1
fi
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "::error::NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。${hint}"
  failed=1
else
  # 公開キー（JWT）の ref が URL のプロジェクトと同じか、role が anon かを確かめる。
  # 別のプロジェクトのキーではログインが壊れ、service_role などの秘密のキーはブラウザに渡る JS に埋め込まれてしまうため。
  # 許可するものだけを通す: 照合できた JWT と、中身を確かめられない公開用の sb_publishable_（警告だけ）。それ以外は失敗させる。
  expected_ref="${EXPECTED_SUPABASE_URL#https://}"
  expected_ref="${expected_ref%%.*}"
  case "$NEXT_PUBLIC_SUPABASE_ANON_KEY" in
    sb_publishable_*)
      echo "::warning::NEXT_PUBLIC_SUPABASE_ANON_KEY が JWT ではないため、プロジェクトを確かめられません。"
      ;;
    *)
      claims="$(node -e '
        const parts = process.argv[1].split(".");
        if (parts.length !== 3) process.exit(0);
        try {
          const p = JSON.parse(Buffer.from(parts[1], "base64url").toString());
          process.stdout.write([p.ref, p.role].filter(Boolean).join(" "));
        } catch {}
      ' -- "$NEXT_PUBLIC_SUPABASE_ANON_KEY")"
      if [ "$claims" != "${expected_ref} anon" ]; then
        echo "::error::NEXT_PUBLIC_SUPABASE_ANON_KEY が ${expected_ref} の anon キーではありません（実際: ${claims:-JWT として読めない}）。${hint}"
        failed=1
      fi
      ;;
  esac
fi
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "::error::CLOUDFLARE_ACCOUNT_ID が未設定です。${hint}"
  failed=1
fi
exit "$failed"
