FROM node:22-bookworm-slim AS web-builder

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html svelte.config.js tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
RUN npm run build:web

FROM rust:1-slim AS api-builder

ARG BUILD_SHA=dev
ENV BUILD_SHA=${BUILD_SHA}
WORKDIR /build

COPY server/Cargo.toml server/Cargo.lock ./server/
COPY server/src ./server/src
COPY server/migrations ./server/migrations
RUN cargo build --manifest-path server/Cargo.toml --release --locked

FROM debian:bookworm-slim AS runtime-files

RUN mkdir /data && chown 65532:65532 /data

FROM gcr.io/distroless/cc-debian12:nonroot

ARG BUILD_SHA=dev
ENV BUILD_SHA=${BUILD_SHA}
ENV PORT=8080
WORKDIR /app
COPY --from=api-builder /build/server/target/release/parts-promise-api /usr/local/bin/parts-promise-api
COPY --from=web-builder /build/dist /app/dist
COPY --from=runtime-files --chown=nonroot:nonroot /data /data
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/usr/local/bin/parts-promise-api"]
