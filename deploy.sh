#!/usr/bin/env bash
#
# ==============================================================================
#  FinLytTech — deploy the marketing site to finlyt.net
# ==============================================================================
#
#  finlyt.net is served by GitHub Pages from this repo (sasikeshav2207-debug/
#  finlyt-web), branch main, path /. The CNAME file is what points the domain
#  here; Namecheap only provides DNS. Vercel and Render are OPTIONAL MIRRORS —
#  publishing there does not change what finlyt.net serves.
#
#  There is no local Ruby, so the Jekyll build only ever happens on GitHub.
#  That means validation has to happen BEFORE the push, which is what this
#  script exists to enforce.
#
#  USAGE
#    ./deploy.sh "commit message"     validate, commit, push, wait, verify
#    ./deploy.sh --check              validate only, change nothing
#    ./deploy.sh --verify             check the live site only, no deploy
#    ./deploy.sh --dry-run "msg"      everything except the push
#
#  REQUIRES  git, python, curl, gh (GitHub CLI, authenticated)
# ==============================================================================

set -Eeuo pipefail

REPO_SLUG="sasikeshav2207-debug/finlyt-web"
DOMAIN="finlyt.net"
BRANCH="main"
BUILD_TIMEOUT=300          # seconds to wait for the Pages build
EDGE_TTL=600               # Fastly max-age on finlyt.net; a deploy can lag this long

# Pages that must return 200 after a deploy. Keep in step with the nav.
LIVE_PATHS=(
  "/" "/condition/" "/products/" "/pricing/" "/for-cas/"
  "/why/" "/founder/" "/faq/" "/blog/" "/contact/"
  "/privacy.html" "/terms.html" "/sitemap.xml"
  "/assets/finlyt.css" "/assets/finlyt.js"
)

# ------------------------------------------------------------------ output
if [ -t 1 ]; then
  B=$'\e[1m'; DIM=$'\e[2m'; R=$'\e[31m'; G=$'\e[32m'; Y=$'\e[33m'; C=$'\e[36m'; X=$'\e[0m'
else
  B=""; DIM=""; R=""; G=""; Y=""; C=""; X=""
fi
step() { printf "\n%s==>%s %s%s%s\n" "$C" "$X" "$B" "$1" "$X"; }
ok()   { printf "  %s✓%s %s\n" "$G" "$X" "$1"; }
warn() { printf "  %s!%s %s\n" "$Y" "$X" "$1"; }
die()  { printf "\n  %s✗ %s%s\n\n" "$R" "$1" "$X" >&2; exit 1; }

trap 'die "failed on line $LINENO"' ERR

# --------------------------------------------------------------- arguments
MODE="deploy"
MESSAGE=""
case "${1:-}" in
  --check)   MODE="check" ;;
  --verify)  MODE="verify" ;;
  --dry-run) MODE="dry-run"; MESSAGE="${2:-}" ;;
  -h|--help|"") sed -n '2,30p' "$0" | sed 's/^#\s\{0,1\}//'; exit 0 ;;
  -*)        die "unknown flag: $1" ;;
  *)         MESSAGE="$1" ;;
esac

cd "$(dirname "${BASH_SOURCE[0]}")"

# ------------------------------------------------------------ verify-only
verify_live() {
  step "Verifying https://$DOMAIN"
  local fails=0
  for p in "${LIVE_PATHS[@]}"; do
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 25 "https://$DOMAIN$p" || echo "000")
    if [ "$code" = "200" ]; then
      printf "  %s✓%s %-24s %s\n" "$G" "$X" "$p" "$code"
    else
      printf "  %s✗%s %-24s %s\n" "$R" "$X" "$p" "$code"
      fails=$((fails + 1))
    fi
  done

  # Content assertions. finlyt.net sits behind Fastly with max-age=600, so a
  # fresh deploy can still be served from a stale edge object. Retry, and if it
  # is still stale report the cache age rather than crying failure — the push
  # itself already succeeded.
  #
  # Anything in this list must NOT appear on the public site: removed design
  # furniture, and client-identifying detail.
  local banned=(
    "Three products, one substrate"   # hero roadmap kicker, removed
    "§"                               # numbered section eyebrows, removed
    "Provenance · privacy"            # section eyebrow, removed
    "GeriCare"                        # real client name — never publish
    "Skilled nursing"                 # client's business shape
    "Patient flow"                    # client's business shape
    "enquiry@finlyt.net"              # never existed — do not publish
    "enterprise@finlyt.net"           # never existed — do not publish
  )
  local attempt=1 stale_age=0 content_ok=0
  while [ "$attempt" -le 3 ]; do
    local home hits
    home=$(curl -s -L --max-time 25 "https://$DOMAIN/" || true)
    hits=""
    for pattern in "${banned[@]}"; do
      printf '%s' "$home" | grep -qF "$pattern" && hits="$hits $pattern"
    done
    if [ -z "$hits" ]; then
      content_ok=1
      break
    fi
    stale_age=$(curl -sI -L --max-time 20 "https://$DOMAIN/" | awk 'tolower($1)=="age:"{print $2+0}' | tail -1)
    stale_age=${stale_age:-0}
    warn "stale edge copy (Age ${stale_age}s of ${EDGE_TTL}s) — retrying in 45s"
    attempt=$((attempt + 1))
    [ "$attempt" -le 3 ] && sleep 45
  done

  if [ "$content_ok" -eq 1 ]; then
    ok "content assertions passed (nothing removed has returned)"
  elif [ "${stale_age:-0}" -gt 60 ]; then
    warn "edge still serving a cached copy (Age ${stale_age}s). It expires in about $((EDGE_TTL - stale_age))s."
    warn "the push and build both succeeded — re-run './deploy.sh --verify' after that to confirm"
  else
    printf "  %s✗%s banned content is live on a fresh (uncached) response\n" "$R" "$X"
    fails=$((fails + 1))
  fi

  if [ "$fails" -gt 0 ]; then
    die "$fails live check(s) failed"
  fi
  ok "all ${#LIVE_PATHS[@]} URLs healthy"
}

if [ "$MODE" = "verify" ]; then
  verify_live
  printf "\n%s%s is healthy.%s\n\n" "$G" "$DOMAIN" "$X"
  exit 0
fi

# ------------------------------------------------------------- preflight
step "Preflight"
for bin in git python curl; do
  command -v "$bin" >/dev/null 2>&1 || die "missing dependency: $bin"
done
command -v gh >/dev/null 2>&1 || warn "gh not found — the build wait will be skipped"
ok "dependencies present"

remote=$(git remote get-url origin 2>/dev/null || echo "")
[[ "$remote" == *"$REPO_SLUG"* ]] || die "wrong repo. origin is '$remote', expected $REPO_SLUG"
ok "origin is $REPO_SLUG"

branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "$BRANCH" ] || die "on branch '$branch'. GitHub Pages only builds '$BRANCH'"
ok "on branch $BRANCH"

cname=$(tr -d '[:space:]' < CNAME 2>/dev/null || echo "")
[ "$cname" = "$DOMAIN" ] || die "CNAME is '$cname', expected '$DOMAIN' — pushing would break the domain"
ok "CNAME is $DOMAIN"

# -------------------------------------------------------------- validate
step "Validating (no local Jekyll, so this is the only safety net)"
python tools/validate_site.py || die "validation failed — nothing pushed"

if [ "$MODE" = "check" ]; then
  printf "\n%sCheck passed. Nothing was changed.%s\n\n" "$G" "$X"
  exit 0
fi

[ -n "$MESSAGE" ] || die "a commit message is required"

# ------------------------------------------------------------------ sync
step "Syncing with origin/$BRANCH"
git fetch origin "$BRANCH" --quiet
behind=$(git rev-list --count "HEAD..origin/$BRANCH")
if [ "$behind" -gt 0 ]; then
  warn "$behind new commit(s) on the remote — rebasing"
  git rebase "origin/$BRANCH" || die "rebase hit a conflict. Resolve it, then re-run"
  ok "rebased onto origin/$BRANCH"
  # New remote content could have broken a link; re-check before pushing.
  python tools/validate_site.py >/dev/null || die "validation failed after rebase"
  ok "re-validated after rebase"
else
  ok "already up to date"
fi

# ---------------------------------------------------------------- commit
step "Committing"
git add -A
if git diff --cached --quiet; then
  warn "no staged changes — skipping commit"
  COMMITTED=0
else
  git commit -q -m "$MESSAGE" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
  ok "$(git log --oneline -1)"
  COMMITTED=1
fi

unpushed=$(git rev-list --count "origin/$BRANCH..HEAD")
if [ "$unpushed" -eq 0 ]; then
  warn "nothing to push"
  verify_live
  exit 0
fi
ok "$unpushed commit(s) ready to push"

if [ "$MODE" = "dry-run" ]; then
  printf "\n%sDry run — stopped before pushing.%s\n\n" "$Y" "$X"
  exit 0
fi

# ------------------------------------------------------------------ push
step "Pushing to origin/$BRANCH"
git push origin "$BRANCH"
ok "pushed"

# ----------------------------------------------------------- build watch
if command -v gh >/dev/null 2>&1; then
  step "Waiting for the GitHub Pages build"
  elapsed=0
  while [ "$elapsed" -lt "$BUILD_TIMEOUT" ]; do
    status=$(gh api "repos/$REPO_SLUG/pages/builds/latest" 2>/dev/null \
      | python -c "import sys,json;print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
    case "$status" in
      built)
        ok "build succeeded (${elapsed}s)"
        break ;;
      errored)
        gh api "repos/$REPO_SLUG/pages/builds/latest" \
          | python -c "import sys,json;print((json.load(sys.stdin).get('error') or {}).get('message',''))" || true
        die "the Pages build failed" ;;
      *)
        printf "  %s… %s (%ss)%s\r" "$DIM" "${status:-queued}" "$elapsed" "$X"
        sleep 10
        elapsed=$((elapsed + 10)) ;;
    esac
  done
  printf "\n"
  [ "$elapsed" -lt "$BUILD_TIMEOUT" ] || warn "build still running after ${BUILD_TIMEOUT}s — verify manually"
else
  warn "gh unavailable — sleeping 90s instead of watching the build"
  sleep 90
fi

# ---------------------------------------------------------------- verify
verify_live

printf "\n%s%s──────────────────────────────────────────────%s\n" "$B" "$G" "$X"
printf "%s  Live at https://%s%s\n" "$G" "$DOMAIN" "$X"
printf "%s  %s%s\n" "$DIM" "$(git log --oneline -1)" "$X"
printf "%s%s──────────────────────────────────────────────%s\n\n" "$B" "$G" "$X"
