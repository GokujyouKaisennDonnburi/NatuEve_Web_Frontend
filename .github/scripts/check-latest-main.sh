#!/usr/bin/env bash
# デプロイの直前に、この実行のコミットが main の最新かを確かめる（ADR-0003 決定 3）。
# 承認待ちや実行の待機中に main が進んでいたら、古いコミットで上書きしないよう止める。
#
# 使う環境変数: GH_TOKEN（contents: read の github.token）、GITHUB_REPOSITORY・GITHUB_SHA（Actions が設定する）
set -euo pipefail

latest="$(gh api "repos/${GITHUB_REPOSITORY}/commits/main" --jq .sha)" || {
  echo "::error::main の最新のコミットを取得できませんでした。デプロイしません。"
  exit 1
}
if [ "$latest" != "$GITHUB_SHA" ]; then
  echo "::error::この実行のコミット（${GITHUB_SHA}）は main の最新（${latest}）ではありません。デプロイしません。最新のコミットは、それを含む後の実行で出してください。"
  exit 1
fi
