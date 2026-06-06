# Per-tenant образ Hermes Agent. Один такой контейнер обслуживает одного клиента.
# Собирается один раз:  docker build -t hermes-tenant:latest hermes-tenant/
#
# Данные агента (SQLite, память, скиллы) живут в /data — это volume, который
# control-plane монтирует с хоста (TENANTS_DATA_DIR/<tenantId>), чтобы они
# переживали пересоздание контейнера.

FROM debian:bookworm-slim

# Зависимости установщика Hermes (Node, Python, git, ripgrep, ffmpeg, curl).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates git python3 python3-venv ripgrep ffmpeg xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Непривилегированный пользователь — агент исполняет команды, не даём ему root.
RUN useradd -m -u 10001 hermes
USER hermes
WORKDIR /home/hermes

# Установка Hermes Agent (официальный one-liner).
# Закрепи конкретную версию в проде вместо main для воспроизводимости.
RUN curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash \
    || curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

ENV PATH="/home/hermes/.local/bin:/home/hermes/.hermes/bin:${PATH}"
ENV HERMES_DATA_DIR="/data"

COPY --chown=hermes:hermes entrypoint.sh /home/hermes/entrypoint.sh
RUN chmod +x /home/hermes/entrypoint.sh

ENTRYPOINT ["/home/hermes/entrypoint.sh"]
