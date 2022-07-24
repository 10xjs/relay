FROM oryd/kratos:v0.10.1-arm64

COPY --chown=ory:ory home/ory/ /home/ory/
COPY --chown=ory:ory docker-entrypoint.sh /

ENTRYPOINT ["sh", "/docker-entrypoint.sh", "kratos", "--config=/home/ory/.kratos.yml"]
CMD ["serve"]
