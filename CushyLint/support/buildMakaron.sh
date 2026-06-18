#!/bin/bash
set -e -o pipefail -u
cd "${0%/*}"
mkdir -p "../build"
./BuildCpp.sh release x64 ../build/MakaronCmd -std=c++11 -I ./ ./MakaronCmd.cpp ./Makaron.cpp
