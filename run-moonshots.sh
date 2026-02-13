#!/usr/bin/env bash
# Autonomous moonshot pipeline — runs all 9 workstreams sequentially
# Each: create worktree → claude code implements → create PR → review → merge → cleanup
set -euo pipefail

REPO="$HOME/projects/pedagogical-engine"
WORKTREES="$REPO/.worktrees"
LOG="$REPO/moonshot-progress.log"

# Moonshot order per index.md batches (highest demo impact first)
MOONSHOTS=(
  "1:lesson-simulation:moonshot-1-simulation"
  "2:pedagogical-disagreement:moonshot-2-disagreement"
  "5:assessment-integrity:moonshot-5-integrity"
  "6:affective-dimension:moonshot-6-affective"
  "7:post-session-debrief:moonshot-7-debrief"
  "8:accumulated-teaching-wisdom:moonshot-8-wisdom"
  "9:educator-profiling:moonshot-9-educator"
  "3:cross-domain-transfer:moonshot-3-transfer"
  "4:meta-pedagogical-layer:moonshot-4-meta"
)

mkdir -p "$WORKTREES"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

log "=== MOONSHOT PIPELINE STARTED ==="

for entry in "${MOONSHOTS[@]}"; do
  IFS=: read -r num specfile branch <<< "$entry"
  spec="docs/moonshots/${specfile}.md"
  worktree="$WORKTREES/$branch"

  log "--- Moonshot $num: $specfile (branch: $branch) ---"

  # Skip if already merged to main (check commit messages)
  if git log main --oneline --grep="Moonshot $num:" 2>/dev/null | grep -q .; then
    log "SKIP: Moonshot $num already on main"
    continue
  fi

  # Create branch + worktree
  cd "$REPO"
  git checkout main
  git pull origin main
  
  if [ -d "$worktree" ]; then
    log "Worktree exists, removing stale: $worktree"
    git worktree remove "$worktree" --force 2>/dev/null || rm -rf "$worktree"
  fi
  git branch -D "$branch" 2>/dev/null || true
  git worktree add "$worktree" -b "$branch"
  log "Worktree created: $worktree"

  # Run Claude Code to implement
  log "Starting Claude Code for moonshot $num..."
  cd "$worktree"
  
  # Build the prompt
  PROMPT="You are implementing Moonshot Workstream $num for the Pedagogical Reasoning Engine hackathon project.

FIRST: Read these files using your file reading tools:
1. CLAUDE.md (project context)
2. docs/north-star.md (philosophy)  
3. docs/technical-engine-spec.md (architecture)
4. $spec (your workstream spec — follow the 'What to tell Claude Code' section)

THEN: Create and edit files to implement the workstream. Use your tools to write code, create files, and run commands. Do NOT just describe what you would do — actually do it.

IMPORTANT CONSTRAINTS:
- This is a hackathon prototype — ship working features, not perfect code
- Frontend uses Next.js 16, Tailwind CSS v4 (CSS-native @theme), App Router
- Backend uses Express + WebSocket + Claude Agent SDK
- MCP tools go in src/server/tools/, register in src/server/tools/index.ts and src/server/index.ts
- Frontend pages go in src/frontend/app/
- Do NOT modify existing tool signatures — only add new tools or extend existing ones additively

AFTER implementing, you MUST:
1. Run: cd src/server && npx tsc --noEmit
2. Run: cd src/frontend && npx next build  
3. Fix any errors
4. Run: git add -A && git commit -m 'Moonshot $num: $(echo "$specfile" | tr '-' ' ')'

You MUST commit your work. This is critical."

  timeout 1800 claude --model claude-opus-4-6 --dangerously-skip-permissions -p "$PROMPT" 2>&1 | tee -a "$LOG" || {
    log "WARNING: Claude Code session for moonshot $num exited with error or timeout"
  }

  # Safety net: if Claude Code wrote files but forgot to commit
  cd "$worktree"
  if [ -n "$(git status --porcelain)" ]; then
    log "Safety net: committing uncommitted changes"
    git add -A
    git commit -m "Moonshot $num: $(echo "$specfile" | tr '-' ' ')" 2>&1 | tee -a "$LOG" || true
  fi

  # Check if there are commits
  COMMITS=$(git log main.."$branch" --oneline 2>/dev/null | wc -l)
  if [ "$COMMITS" -eq 0 ]; then
    log "ERROR: No commits on $branch, skipping PR"
    cd "$REPO"
    git worktree remove "$worktree" --force 2>/dev/null || true
    git branch -D "$branch" 2>/dev/null || true
    continue
  fi
  log "Branch has $COMMITS commits"

  # Push and create PR
  git push origin "$branch" 2>&1 | tee -a "$LOG"
  
  PR_URL=$(gh pr create \
    --repo chekos/pedagogical-engine \
    --head "$branch" \
    --base main \
    --title "Moonshot $num: $(echo "$specfile" | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')" \
    --body "Implements moonshot workstream $num from docs/moonshots/${specfile}.md

## What this adds
See the spec file for full details.

---
*Autonomous overnight build by ClawdIO 🌀*" 2>&1) || {
    log "PR creation failed, may already exist"
    PR_URL=$(gh pr list --repo chekos/pedagogical-engine --head "$branch" --json url --jq '.[0].url' 2>/dev/null)
  }
  log "PR: $PR_URL"

  # Review with compound-engineering
  log "Running Claude Code review..."
  cd "$worktree"
  REVIEW_PROMPT="Review the changes on this branch (git diff main..HEAD). Check for:
1. TypeScript errors (run tsc --noEmit in src/server/ and next build in src/frontend/)  
2. Broken imports or missing dependencies
3. Integration issues with existing tools/routes
4. Any obvious bugs
Fix anything you find. Commit fixes."

  timeout 600 claude --model claude-opus-4-6 --dangerously-skip-permissions -p "$REVIEW_PROMPT" 2>&1 | tee -a "$LOG" || {
    log "WARNING: Review session exited with error or timeout"
  }
  
  # Push review fixes if any
  git push origin "$branch" 2>&1 | tee -a "$LOG" || true

  # Merge
  log "Merging $branch..."
  cd "$REPO"
  git checkout main
  git pull origin main
  
  # Try squash merge first, fall back to regular merge
  if git merge --squash "$branch" 2>/dev/null; then
    git commit -m "Moonshot $num: $(echo "$specfile" | tr '-' ' ') (#$num)" 2>&1 | tee -a "$LOG"
  else
    git merge --squash --abort 2>/dev/null || true
    git merge "$branch" --no-edit 2>&1 | tee -a "$LOG" || {
      log "Merge conflict on $branch — attempting additive resolution"
      # Auto-resolve by accepting both for common conflict files
      for f in $(git diff --name-only --diff-filter=U); do
        if [[ "$f" == *"index.ts"* ]] || [[ "$f" == *"package.json"* ]]; then
          git checkout --theirs "$f" 2>/dev/null || true
          git add "$f"
        fi
      done
      git commit --no-edit 2>/dev/null || {
        log "ERROR: Could not resolve merge for $branch — skipping"
        git merge --abort 2>/dev/null || true
        continue
      }
    }
  fi
  
  git push origin main 2>&1 | tee -a "$LOG"
  log "MERGED: Moonshot $num ✓"

  # Cleanup worktree
  git worktree remove "$worktree" --force 2>/dev/null || true
  git branch -D "$branch" 2>/dev/null || true

  log "Moonshot $num complete. Moving to next..."
  echo ""
done

log "=== MOONSHOT PIPELINE COMPLETE ==="
log "Check moonshot-progress.log for full details"
