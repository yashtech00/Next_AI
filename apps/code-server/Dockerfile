FROM codercom/code-server:4.96.4

USER root

# Install Node.js 20
RUN apt-get update \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER coder

EXPOSE 8080

# Start code-server without authentication
CMD ["code-server", "--auth", "none", "--bind-addr", "0.0.0.0:8091"]
