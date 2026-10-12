#!/bin/sh
# Seeds once the server answers, so a healthy container is a seeded one.
set -eu

rm -f /tmp/seeded
node ./bin/parse-server ./config.js &
server=$!
trap 'kill "$server"' INT TERM

until wget -qO- http://127.0.0.1:1337/parse/health >/dev/null 2>&1; do
  kill -0 "$server" || exit 1
  sleep 1
done

node ./seed/index.js
touch /tmp/seeded
wait "$server"
