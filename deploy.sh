#! /bin/bash

docker build -t anbraten/plugin-ready-release-go . --push

cd test
./create-merge-pr.sh
cd ..