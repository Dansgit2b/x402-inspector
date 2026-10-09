#!/usr/bin/env bash
# usage: pr.sh owner/repo file python_edit_snippet title body   (fork, branch, edit, PR) — token via env only
set -euo pipefail
R=$1; F=$2; EDIT=$3; T=$4; B=$5; H="Authorization: token $GH_TOKEN"; N=${R#*/}
curl -s -X POST -H "$H" https://api.github.com/repos/$R/forks >/dev/null; sleep 8
D=/tmp/prw/$N; rm -rf $D; mkdir -p /tmp/prw
CH='!f(){ echo username=x-access-token; echo password=$GH_TOKEN; }; f'
git -c credential.helper="$CH" clone -q --depth 1 https://github.com/Dansgit2b/$N.git $D
cd $D; DEF=$(git rev-parse --abbrev-ref HEAD); git checkout -q -b add-x402-inspector
python3 -c "p='$F';s=open(p).read()
$EDIT
open(p,'w').write(s)"
git diff --stat; git -c user.name=Dansgit -c user.email=4308795+Dansgit2b@users.noreply.github.com commit -qam "Add x402 Inspector"
git -c credential.helper="$CH" push -q origin add-x402-inspector
python3 -c "import json,sys;print(json.dumps({'title':sys.argv[1],'head':'Dansgit2b:add-x402-inspector','base':sys.argv[2],'body':sys.argv[3]}))" "$T" "$DEF" "$B" > /tmp/prw/body.json
curl -s -H "$H" https://api.github.com/repos/$R/pulls -d @/tmp/prw/body.json | python3 -c "import sys,json;j=json.load(sys.stdin);print(j.get('html_url') or j)"
