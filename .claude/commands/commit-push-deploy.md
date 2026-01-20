# Commit, Push and Deploy

Commit all staged changes, push to remote, and deploy to GitHub Pages.

## Steps

1. Check git status for changes
2. Stage all modified files (excluding buildTimestamp.ts which is auto-generated)
3. Create a commit with a descriptive message summarizing the changes
4. Push to origin/main
5. Run `npm run deploy` to build and deploy to GitHub Pages

## Commit Message Format

Use conventional commit format:
- Start with a short summary line (50 chars max)
- Add blank line then detailed description if needed
- End with `Co-Authored-By: Claude <noreply@anthropic.com>`

## Example

```bash
git add <files>
git commit -m "$(cat <<'EOF'
Short summary of changes

Detailed description if needed.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
git push
npm run deploy
```
