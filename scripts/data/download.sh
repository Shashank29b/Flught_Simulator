#!/usr/bin/env bash
# Downloads the OurAirports world dataset (public domain) into data/ourairports/.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/../.." && pwd)/data/ourairports"
mkdir -p "$DIR"
for f in airports runways navaids; do
  curl -sSfL --max-time 300 -o "$DIR/$f.csv" "https://davidmegginson.github.io/ourairports-data/$f.csv"
  echo "downloaded $f.csv ($(wc -l < "$DIR/$f.csv") lines)"
done
