#!/usr/bin/env bash
# Retry wrapper for transient network failures during deploy.
#
# Wraps a single command and retries it up to MAX_ATTEMPTS times with
# exponential backoff. Critically, it only retries when the FAILURE
# LOOKS TRANSIENT — network timeouts, DNS issues, 5xx from the provider.
# It does NOT retry on real build failures (compile errors, failing
# tests, signing rejections, etc.) because retrying those wastes time
# and burns CI minutes without addressing the root cause.
#
# Usage:
#   scripts/deploy-retry.sh <command> [args...]
# Examples:
#   scripts/deploy-retry.sh vercel deploy --prod --yes
#   scripts/deploy-retry.sh railway up --service PCSExpress --ci
#
# Environment overrides:
#   MAX_ATTEMPTS   default 3   (1 = no retry)
#   INITIAL_DELAY  default 10  seconds
#   BACKOFF_MULT   default 2
#
# Exit code: forwarded from the underlying command on final attempt.

set -uo pipefail

MAX_ATTEMPTS="${MAX_ATTEMPTS:-3}"
INITIAL_DELAY="${INITIAL_DELAY:-10}"
BACKOFF_MULT="${BACKOFF_MULT:-2}"

if [ $# -eq 0 ]; then
  echo "deploy-retry: no command given" >&2
  echo "usage: $0 <command> [args...]" >&2
  exit 64
fi

# Patterns we consider transient. If ANY of these appears in the captured
# output, we retry. Otherwise we forward the exit code immediately.
# Keep this list tight — over-retrying real failures hides bugs.
TRANSIENT_PATTERNS=(
  "operation timed out"
  "Operation timed out"
  "error sending request"
  "Connection reset"
  "ECONNRESET"
  "ETIMEDOUT"
  "ENETUNREACH"
  "EAI_AGAIN"
  "getaddrinfo"
  "503 Service Unavailable"
  "502 Bad Gateway"
  "504 Gateway Time-?out"
  "Temporary failure in name resolution"
  "i/o timeout"
  "TLS handshake timeout"
  "connection refused"
  "Could not resolve host"
  "remote end closed connection"
  "deadline exceeded"
)

is_transient() {
  local log="$1"
  for pattern in "${TRANSIENT_PATTERNS[@]}"; do
    if echo "$log" | grep -qiE "$pattern"; then return 0; fi
  done
  return 1
}

attempt=1
delay="$INITIAL_DELAY"
tmp_log="$(mktemp -t deploy-retry.XXXXXX)"
trap 'rm -f "$tmp_log"' EXIT

while : ; do
  echo "[deploy-retry] Attempt $attempt/$MAX_ATTEMPTS: $*"
  : > "$tmp_log"
  # tee to both the live terminal and the log file so the user sees
  # real-time output AND we can inspect for transient markers after.
  if "$@" 2>&1 | tee "$tmp_log"; then
    # Pipefail above ensures we see the command's exit code via
    # PIPESTATUS — but tee can mask it. Check explicitly.
    cmd_exit=${PIPESTATUS[0]}
  else
    cmd_exit=${PIPESTATUS[0]}
  fi

  if [ "$cmd_exit" -eq 0 ]; then
    echo "[deploy-retry] ✓ Succeeded on attempt $attempt"
    exit 0
  fi

  if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
    echo "[deploy-retry] ✗ Exhausted $MAX_ATTEMPTS attempts. Last exit code: $cmd_exit" >&2
    exit "$cmd_exit"
  fi

  if ! is_transient "$(cat "$tmp_log")"; then
    echo "[deploy-retry] ✗ Failure does not match transient patterns — not retrying. Exit code: $cmd_exit" >&2
    echo "[deploy-retry]   (Patterns checked: timeout / connection / DNS / 5xx — see scripts/deploy-retry.sh)" >&2
    exit "$cmd_exit"
  fi

  echo "[deploy-retry] ⚠ Transient failure (exit $cmd_exit). Sleeping ${delay}s before attempt $((attempt+1))..." >&2
  sleep "$delay"
  delay=$((delay * BACKOFF_MULT))
  attempt=$((attempt + 1))
done
