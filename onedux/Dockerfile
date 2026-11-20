# onedux: the stock LibreChat image with our patched web client. The server code is untouched.
# Built by .github/workflows/onedux-image.yml from a context that holds only client/dist.
# The base is digest-pinned: rkex nodes already cache its layers, so only the dist layer is pulled.
ARG BASE=ghcr.io/librechat-ai/librechat:v0.8.9@sha256:4a3967a47031c1fdba8302a6a341be7671101e40b617f7934ba25aac69fcea2b
FROM ${BASE}
RUN rm -rf /app/client/dist
COPY --chown=node:node dist /app/client/dist
