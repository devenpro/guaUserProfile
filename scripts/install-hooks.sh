#!/usr/bin/env bash
# Install git hooks into .git/hooks/. One-time setup; run after cloning.
#
# This is a stay-zero-dep alternative to husky. The actual hook bodies
# live under scripts/hooks/ (so they're version-controlled and reviewable
# in PRs); this script just symlinks them into the per-clone .git/hooks/
# directory. Re-run any time the hook bodies change.

set -e

repo_root=$(git rev-parse --show-toplevel)
src_dir="$repo_root/scripts/hooks"
dst_dir="$repo_root/.git/hooks"

if [ ! -d "$src_dir" ]; then
  echo "install-hooks: $src_dir not found — are you in a checkout of guaUserProfile?" >&2
  exit 1
fi
if [ ! -d "$dst_dir" ]; then
  echo "install-hooks: $dst_dir not found — is this a git repo?" >&2
  exit 1
fi

installed=0
for hook in "$src_dir"/*; do
  name=$(basename "$hook")
  target="$dst_dir/$name"
  # rm any prior install (symlink or plain file) so re-running is idempotent.
  [ -e "$target" ] || [ -L "$target" ] && rm -f "$target"
  ln -s "../../scripts/hooks/$name" "$target"
  chmod +x "$hook"
  echo "✓ installed $name"
  installed=$((installed + 1))
done

echo "Done — $installed hook(s) installed into .git/hooks/."
