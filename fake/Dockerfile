FROM parseplatform/parse-server:9.10.7

COPY config.js server.js entrypoint.sh ./
COPY cloud/ ./cloud/
COPY seed/ ./seed/

# Numeric, so Kubernetes can check runAsNonRoot. The server and the seed write only to /tmp.
USER 1000:1000
# Parse Server opens ./logs when it loads, and the root filesystem is read-only. "null" logs to the console only.
ENV PARSE_SERVER_LOGS_FOLDER=null
EXPOSE 1337

HEALTHCHECK --interval=2s --timeout=5s --start-period=120s \
  CMD wget -qO- http://127.0.0.1:1337/ready

ENTRYPOINT ["sh", "./entrypoint.sh"]
