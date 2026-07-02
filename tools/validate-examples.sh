#!/usr/bin/env bash
#
# Validate the bundled example packages end to end: Cushy schema, JavaScript, and
# static IVG. This is the single "are the examples valid?" entry point; it
# orchestrates the per-language validators and adds the CushyLint pass that none
# of them cover.
#
# Scope:
#   - Cushy: every <Name>.spscript package under examples/ plus JS Console.spscript
#   - JS:    delegated to validate-js.sh (defaults to the same example scope)
#   - IVG:   delegated to validate-static-ivg.sh (example .ivg plus the shared
#            Synplant Resources the examples depend on)
#
# Exits non-zero if any section fails, after running them all so you see every
# problem in one run.

set -uo pipefail

sdk_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$sdk_root"

cushylint="$sdk_root/CushyLint/CushyLint"
tmp_root=""

cleanup() {
	if [ -n "$tmp_root" ]; then
		rm -rf "$tmp_root"
	fi
}
trap cleanup EXIT

set_package_for_cushylint() {
	local pkg="$1"
	if ! find "$pkg" -name '*.schema' -print0 | xargs -0 grep -q 'references/synplant-scripts-sdk'; then
		cushy_pkg="$sdk_root/$pkg/"
		return
	fi

	# Some bundled examples double as copy-ready external-project examples, so
	# their .schema files point at references/synplant-scripts-sdk. Validate the
	# same package contents in a temporary project-shaped mirror instead of
	# rewriting the checked-in schema.
	if [ -z "$tmp_root" ]; then
		tmp_root="$(mktemp -d "${TMPDIR:-/tmp}/synplant-examples.XXXXXX")"
		mkdir -p "$tmp_root/examples" "$tmp_root/references"
		ln -s "$sdk_root" "$tmp_root/references/synplant-scripts-sdk"
	fi
	local mirrored="$tmp_root/$pkg"
	rm -rf "$mirrored"
	mkdir -p "$(dirname "$mirrored")"
	cp -R "$pkg" "$mirrored"
	cushy_pkg="$mirrored/"
}

packages=()
for pkg in examples/*.spscript "JS Console.spscript"; do
	[ -d "$pkg" ] && packages+=("$pkg")
done

failures=()

echo "== Cushy schema (CushyLint) =="
for pkg in "${packages[@]}"; do
	# Skip packages without a .cushy (nothing for CushyLint to check).
	if ! find "$pkg" -name '*.cushy' -print -quit | grep -q .; then
		echo "skipped (no .cushy) $pkg"
		continue
	fi
	cushy_pkg=""
	set_package_for_cushylint "$pkg"
	if "$cushylint" "$cushy_pkg" >/tmp/cushylint.$$.log 2>&1; then
		echo "ok   $pkg"
	else
		echo "FAIL $pkg" >&2
		cat /tmp/cushylint.$$.log >&2
		failures+=("cushy: $pkg")
	fi
	rm -f /tmp/cushylint.$$.log
done

echo
echo "== JavaScript (ESLint) =="
if tools/validate-js.sh "${packages[@]}"; then
	echo "ok   JavaScript"
else
	failures+=("javascript")
fi

echo
echo "== Static IVG =="
if tools/validate-static-ivg.sh; then
	echo "ok   static IVG"
else
	failures+=("static-ivg")
fi

echo
if [ "${#failures[@]}" -ne 0 ]; then
	echo "FAILED: ${failures[*]}" >&2
	exit 1
fi
echo "All example checks passed."
