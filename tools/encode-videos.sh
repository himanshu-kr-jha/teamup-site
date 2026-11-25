#!/usr/bin/env bash
# Re-encodes the TeamUp product recordings for the web.
#
# Every source shows the made-up company Nimbus Labs from the demo server
# (teamup-linkedin/scripts/seed.mjs), never real people or data.
# Loops have no audio, are 720p at most, and start playing before they finish
# downloading (faststart). Each gets an H.264 MP4 for every browser, a VP9 WebM
# that is usually smaller, and a poster frame in AVIF and WebP.
#
# Usage: tools/encode-videos.sh   (from the site folder; needs ffmpeg 6+)
set -euo pipefail

LIVE="${LIVE:-$HOME/Documents/Ongoing_Projects/teamup-linkedin/capture/live}"
OUT="assets/video"
POST="assets/img/posters"
mkdir -p "$OUT" "$POST"

# name  start  length  poster-at
CLIPS=(
  "chat     0    10.8  7.5"
  "call     1.5  11    9"
  "notes    0    10.6  5"
  "tasks    0    7.6   1"
  "calendar 0    9.2   8"
  "standup  0    12    11.5"
  "search   0    5.4   4.5"
  # From 5 s, below the disk gauge: the demo machine was nearly full.
  "system   5    2.4   6"
)

loop() { # src start len width out-base
  local src=$1 ss=$2 t=$3 w=$4 base=$5
  ffmpeg -v error -y -ss "$ss" -t "$t" -i "$src" -an \
    -vf "scale=${w}:-2:flags=lanczos,fps=24,format=yuv420p" \
    -c:v libx264 -profile:v high -preset slow -crf 30 -movflags +faststart "$base.mp4"
  ffmpeg -v error -y -ss "$ss" -t "$t" -i "$src" -an \
    -vf "scale=${w}:-2:flags=lanczos,fps=24,format=yuv420p" \
    -c:v libvpx-vp9 -b:v 0 -crf 42 -row-mt 1 -deadline good -cpu-used 2 "$base.webm"
}

poster() { # src at width out-base
  local src=$1 at=$2 w=$3 base=$4
  ffmpeg -v error -y -ss "$at" -i "$src" -frames:v 1 -vf "scale=${w}:-2:flags=lanczos" -c:v libwebp -quality 72 "$base.webp"
  ffmpeg -v error -y -ss "$at" -i "$src" -frames:v 1 -vf "scale=${w}:-2:flags=lanczos,format=yuv420p" \
    -c:v libaom-av1 -still-picture 1 -crf 34 -cpu-used 6 "$base.avif"
}

for row in "${CLIPS[@]}"; do
  read -r name ss t at <<<"$row"
  src="$LIVE/$name.mp4"
  echo "· $name"
  loop "$src" "$ss" "$t" 1152 "$OUT/$name"          # product tour, full width
  loop "$src" "$ss" "$t" 640  "$OUT/$name-sm"       # hero tiles and phones
  poster "$src" "$at" 1152 "$POST/$name"
  poster "$src" "$at" 640  "$POST/$name-sm"
done

echo "· phone"
loop "$LIVE/phone.mp4" 0 5.1 360 "$OUT/phone"
poster "$LIVE/phone.mp4" 4.5 360 "$POST/phone"

du -ch "$OUT"/* | tail -1
