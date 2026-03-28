#!/bin/sh
# apply_bundle.sh
# Usage: ./apply_bundle.sh path/to/staff-portal-notifications.patch [target-root]
# This script extracts files from the bundle created by the assistant and writes them
# to the specified target root (defaults to current directory).

BUNDLE=${1:-staff-portal-notifications.patch}
TARGET_ROOT=${2:-.}

if [ ! -f "$BUNDLE" ]; then
  echo "Bundle file not found: $BUNDLE"
  exit 1
fi

perl -e '
  use strict; use warnings;
  my $bundle = shift or die "missing bundle";
  my $target = shift // ".";
  open my $fh, "<:raw", $bundle or die "open $bundle: $!";
  my $out;
  while(<$fh>) {
    if(/^----- BEGIN FILE: (.+) -----$/) {
      $out = $1;
      # full path under target
      my $full = "$target/$out";
      if ($full =~ m{^(.+)/}) {
        my $dir = $1;
        system("mkdir -p \"$dir\"") == 0 or die "mkdir failed: $dir";
      }
      open my $of, ">:raw", $full or die "open $full: $!";
      # print header comment
      next;
    }
    if(/^----- END FILE:/) {
      close $of if defined $of;
      undef $out;
      next;
    }
    if (defined $out) {
      print $of $_;
    }
  }
  close $fh;
' "$BUNDLE" "$TARGET_ROOT"

if [ $? -eq 0 ]; then
  echo "Bundle applied to: $TARGET_ROOT"
  echo "Next: review changes, git add/commit, then push to your remote branch."
else
  echo "Failed to apply bundle."
fi
