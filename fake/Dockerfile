FROM parseplatform/parse-server:9.10.4

COPY config.js ./config.js
COPY cloud/ ./cloud/
COPY seed/ ./seed/
COPY entrypoint.sh ./entrypoint.sh

HEALTHCHECK --interval=2s --timeout=5s --start-period=120s \
  CMD test -f /tmp/seeded && wget -qO- http://127.0.0.1:1337/parse/health

ENTRYPOINT ["sh", "./entrypoint.sh"]
