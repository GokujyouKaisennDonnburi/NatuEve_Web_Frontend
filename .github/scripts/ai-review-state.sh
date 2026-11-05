#!/usr/bin/env bash
# AIレビューの状態管理と incremental 用差分の生成。
#
# 使い方:
#   ai-review-state.sh prepare
#   ai-review-state.sh save <reviewed_sha> <full|incremental> <state_comment_id>
#
# prepare で使う環境変数:
#   GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, HEAD_SHA, BASE_SHA, HEAD_REF, GITHUB_OUTPUT
#   RUNNER_TEMP（任意）, MAX_DIFF_BYTES（任意、既定 120000）
#
# save で使う環境変数:
#   GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, GITHUB_RUN_ID（任意）
set -euo pipefail

readonly DEFAULT_MAX_DIFF_BYTES=120000

die() {
  echo "::error::$*" >&2
  exit 1
}

warn() {
  echo "::warning::$*" >&2
}

require_env() {
  local name
  for name in "$@"; do
    if [ -z "${!name:-}" ]; then
      die "Environment variable ${name} is not set"
    fi
  done
}

normalize_sha() {
  local value="${1:-}"
  case "$value" in
    *[!0-9a-f]*|'')
      printf ''
      ;;
    *)
      if [ "${#value}" -eq 40 ]; then
        printf '%s' "$value"
      else
        printf ''
      fi
      ;;
  esac
}

write_output() {
  local name="$1"
  local value="${2:-}"
  local delimiter
  delimiter="$(openssl rand -hex 16)"
  {
    printf '%s<<%s\n' "$name" "$delimiter"
    printf '%s\n' "$value"
    printf '%s\n' "$delimiter"
  } >> "$GITHUB_OUTPUT"
}

prepare() {
  local head_sha base_sha last_sha
  local state_output state_status state_line state_comment_id state_body payload
  local mode base_for_review diff_file diff_truncated
  local status max_bytes tmp

  case "$PR_NUMBER" in
    *[!0-9]*|'')
      die "PR_NUMBER is invalid: ${PR_NUMBER}"
      ;;
  esac

  head_sha="$(normalize_sha "${HEAD_SHA:-}")"
  [ -n "$head_sha" ] || die "HEAD_SHA is invalid: ${HEAD_SHA:-}"
  base_sha="$(normalize_sha "${BASE_SHA:-}")"
  [ -n "$base_sha" ] || die "BASE_SHA is invalid: ${BASE_SHA:-}"

  # イベント時点の head をレビュー対象にするため、ローカルブランチをその SHA に固定する。
  # これにより、prepare と Action の間に branch tip が進んでも、レビュー対象と差分の基準がずれない。
  if ! git branch --force "$HEAD_REF" "$head_sha" >/dev/null 2>&1; then
    warn "レビュー対象のローカルブランチ ${HEAD_REF} を作成できませんでした。Action は branch tip を checkout します。"
  else
    # Action が AI の変更を push する場合に備え、upstream を設定しておく。
    git config "branch.${HEAD_REF}.remote" origin >/dev/null 2>&1 || true
    git config "branch.${HEAD_REF}.merge" "refs/heads/${HEAD_REF}" >/dev/null 2>&1 || true
  fi

  state_output=''
  state_status=0
  state_output="$(gh api --paginate "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    --jq '.[] | select(.user.login == "github-actions[bot]") | select(.body | startswith("<!-- ai-review-state:")) | [.id, .updated_at, .body] | @tsv' \
    2>/dev/null)" || state_status=$?
  if [ "$state_status" -ne 0 ]; then
    warn "状態コメントを取得できませんでした。full レビューにフォールバックします。"
    state_output=''
  fi
  state_line="$(printf '%s\n' "$state_output" | sort -t $'\t' -k2,2 | tail -n 1)"

  state_comment_id=''
  last_sha=''
  if [ -n "$state_line" ]; then
    IFS=$'\t' read -r state_comment_id state_body <<< "$state_line"
    payload="${state_body#*ai-review-state:}"
    payload="${payload%% -->*}"
    last_sha="$(printf '%s' "$payload" | jq -r '.last_reviewed_sha // empty' 2>/dev/null || true)"
    case "$state_comment_id" in
      *[!0-9]*|'')
        state_comment_id=''
        ;;
    esac
  fi
  last_sha="$(normalize_sha "$last_sha")"

  mode='full'
  base_for_review="$base_sha"
  diff_file=''
  diff_truncated='false'

  if [ -n "$last_sha" ]; then
    if [ "$last_sha" = "$head_sha" ]; then
      mode='skip'
      base_for_review="$last_sha"
    elif ! git cat-file -e "${last_sha}^{commit}" 2>/dev/null; then
      warn "前回レビュー済みSHA ${last_sha} がローカルに存在しません。full レビューにフォールバックします。"
    elif ! git merge-base --is-ancestor "$last_sha" "$head_sha" 2>/dev/null; then
      warn "前回レビュー済みSHA ${last_sha} は ${head_sha} の祖先ではありません。full レビューにフォールバックします。"
    else
      mode='incremental'
      base_for_review="$last_sha"
    fi
  fi

  if [ "$mode" = 'incremental' ]; then
    status=0
    git diff --quiet "${base_for_review}..${head_sha}" -- . ':(exclude)bun.lock' || status=$?
    if [ "$status" -eq 0 ]; then
      mode='skip'
      base_for_review="$base_sha"
      diff_file=''
    elif [ "$status" -eq 1 ]; then
      diff_file="${RUNNER_TEMP:-/tmp}/ai-review.diff"
      if ! {
        printf '## Diff stat\n' &&
          git diff --no-color --stat "${base_for_review}..${head_sha}" -- . ':(exclude)bun.lock' &&
          printf '\n## Diff\n' &&
          git diff --no-color --unified=3 "${base_for_review}..${head_sha}" -- . ':(exclude)bun.lock'
      } > "$diff_file"; then
        warn "差分の生成に失敗しました。full レビューにフォールバックします。"
        mode='full'
        base_for_review="$base_sha"
        diff_file=''
      fi

      if [ "$mode" = 'incremental' ]; then
        max_bytes="${MAX_DIFF_BYTES:-$DEFAULT_MAX_DIFF_BYTES}"
        case "$max_bytes" in
          *[!0-9]*|'')
            max_bytes="$DEFAULT_MAX_DIFF_BYTES"
            ;;
        esac
        if [ "$(wc -c < "$diff_file")" -gt "$max_bytes" ]; then
          tmp="${diff_file}.tmp"
          if ! {
            head -c "$max_bytes" "$diff_file" | iconv -f UTF-8 -t UTF-8 -c > "$tmp" &&
              printf '\n\n... (差分が長いため %s バイトで省略しました。残りは head の working tree を読んで確認してください) ...\n' "$max_bytes" >> "$tmp" &&
              mv "$tmp" "$diff_file"
          }; then
            warn "差分のtruncateに失敗しました。full レビューにフォールバックします。"
            mode='full'
            base_for_review="$base_sha"
            diff_file=''
            rm -f "$tmp" 2>/dev/null || true
          else
            diff_truncated='true'
          fi
        fi
      fi
    else
      warn "差分の確認に失敗しました。full レビューにフォールバックします。"
      mode='full'
      base_for_review="$base_sha"
      diff_file=''
    fi
  fi

  write_output mode "$mode"
  write_output base_sha "$base_for_review"
  write_output head_sha "$head_sha"
  write_output state_comment_id "$state_comment_id"
  write_output diff_file "$diff_file"
  write_output diff_truncated "$diff_truncated"
}

save_state() {
  local reviewed_sha="$1"
  local mode="$2"
  local comment_id="${3:-}"
  local timestamp payload body json_payload

  reviewed_sha="$(normalize_sha "$reviewed_sha")"
  [ -n "$reviewed_sha" ] || die "Reviewed SHA is invalid: ${1:-}"

  case "$mode" in
    full|incremental)
      ;;
    *)
      die "Mode must be full or incremental: ${mode}"
      ;;
  esac

  case "$comment_id" in
    *[!0-9]*|'')
      comment_id=''
      ;;
  esac

  timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  payload="$(jq -cn \
    --arg sha "$reviewed_sha" \
    --arg mode "$mode" \
    --arg ts "$timestamp" \
    --arg run "${GITHUB_RUN_ID:-}" \
    '{last_reviewed_sha:$sha,last_mode:$mode,updated_at:$ts,run_id:$run}')" || die "Failed to build state payload"

  body="<!-- ai-review-state:${payload} -->
AIレビューの状態管理用コメントです（自動更新）。最終レビュー: ${reviewed_sha:0:12} (${mode})"
  json_payload="$(jq -cn --arg body "$body" '{body:$body}')" || die "Failed to build comment payload"

  if [ -n "$comment_id" ]; then
    if ! printf '%s\n' "$json_payload" | gh api --method PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${comment_id}" --input - >/dev/null; then
      warn "状態コメントの更新に失敗しました。次回のレビューに任せます。"
    fi
    return 0
  fi

  if ! printf '%s\n' "$json_payload" | gh api --method POST "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" --input - >/dev/null; then
    warn "状態コメントの作成に失敗しました。次回は full レビューになります。"
  fi
}

main() {
  local command="${1:-}"
  case "$command" in
    prepare)
      require_env GITHUB_REPOSITORY PR_NUMBER HEAD_SHA BASE_SHA HEAD_REF GH_TOKEN GITHUB_OUTPUT
      prepare
      ;;
    save)
      shift
      require_env GITHUB_REPOSITORY PR_NUMBER GH_TOKEN
      save_state "${1:-}" "${2:-}" "${3:-}"
      ;;
    *)
      die "Usage: $0 {prepare|save <reviewed_sha> <full|incremental> <state_comment_id>}"
      ;;
  esac
}

main "$@"
