FROM rust:1.98-bookworm AS api-builder

ARG BUILD_SHA=dev
ENV BUILD_SHA=${BUILD_SHA}
WORKDIR /build

COPY server/Cargo.toml server/Cargo.lock ./server/
COPY server/src ./server/src
RUN cargo build --manifest-path server/Cargo.toml --release --locked

FROM gcr.io/distroless/cc-debian12:nonroot

ARG BUILD_SHA=dev
ENV BUILD_SHA=${BUILD_SHA}
ENV PORT=8080
COPY --from=api-builder /build/server/target/release/parts-promise-api /usr/local/bin/parts-promise-api
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/usr/local/bin/parts-promise-api"]
