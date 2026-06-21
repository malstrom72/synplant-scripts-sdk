#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

renderer="${IVG2PNG:-tools/IVG2PNG/IVG2PNG}"
font_dir="${IVG_FONTS:-IVG/fonts}"
output_dir="${1:-/tmp/synplant-static-ivg-validation}"
root="$(pwd)"

if [ ! -x "$renderer" ]; then
	tools/build-ivg2png.sh release native nosimd
fi

mkdir -p "$output_dir"
output_dir="$(cd "$output_dir" && pwd)"

case "$renderer" in
	/*) renderer_path="$renderer" ;;
	*) renderer_path="$root/$renderer" ;;
esac

case "$font_dir" in
	/*) font_path="$font_dir" ;;
	*) font_path="$root/$font_dir" ;;
esac

status=0
while IFS= read -r -d '' ivg_file; do
	relative="${ivg_file#./}"
	output_file="$output_dir/${relative//\//__}.png"
	log_file="$output_file.log"
	ivg_dir="$(dirname "$ivg_file")"
	ivg_name="$(basename "$ivg_file")"
	if (cd "$ivg_dir" && "$renderer_path" --fast --fonts "$font_path" "$ivg_name" "$output_file") >"$log_file" 2>&1; then
		echo "rendered $relative -> $output_file"
	elif grep -q "Variable .* does not exist" "$log_file"; then
		echo "skipped dynamic $relative"
	elif grep -q "Could not include file" "$log_file"; then
		echo "skipped include-dependent $relative"
	elif grep -q "Undeclared bounds" "$log_file"; then
		echo "skipped helper $relative"
	else
		cat "$log_file" >&2
		echo "failed $relative" >&2
		status=1
	fi
done < <(find "Synplant Resources" examples -name '*.ivg' -print0)

exit "$status"
