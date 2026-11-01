---
id: backend/nestjs-microservices
title: NestJS microservices, real-time events and queues
description: NestJS 12 microservice transports and their security (TCP is plaintext; TLS options per transport), ClientProxy send/emit patterns with timeouts, message payload validation, real-time updates through a generic pub/sub publisher, and BullMQ queues whose processors throw so retries work. Use when editing @MessagePattern/@EventPattern handlers, ClientsModule registrations, publishers or queue processors in a NestJS project.
applies_to: "@nestjs/microservices >=12.0 <13"
legacy_rule: legacy/nestjs-legacy
globs: ["src/**/*.module.ts", "src/**/*.controller.ts", "src/**/*.service.ts", "src/**/*.processor.ts", "src/**/*.consumer.ts", "src/**/*.publisher.ts", "apps/*/src/main.ts"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://docs.nestjs.com/microservices/basics
  - https://docs.nestjs.com/microservices/pipes
  - https://docs.nestjs.com/microservices/exception-filters
  - https://docs.nestjs.com/microservices/redis
  - https://docs.nestjs.com/microservices/nats
  - https://docs.nestjs.com/microservices/rabbitmq
  - https://docs.nestjs.com/microservices/kafka
  - https://docs.nestjs.com/microservices/grpc
  - https://docs.nestjs.com/faq/hybrid-application
  - https://docs.nestjs.com/migration-guide
  - https://docs.nestjs.com/techniques/queues
  - https://docs.bullmq.io/guide/retrying-failing-jobs
  - https://docs.bullmq.io/guide/jobs/job-ids
  - https://kafka.js.org/docs/configuration
  - https://www.npmjs.com/package/kafkajs
  - https://www.npmjs.com/package/bullmq
  - https://osv.dev/vulnerability/GHSA-96h4-vgxj-gvm2
  - https://osv.dev/vulnerability/GHSA-m8vh-jmq9-5rjg
  - https://osv.dev/vulnerability/GHSA-hpwf-8g29-85qm
---

# NestJS microservices, real-time events and queues

Apply with `backend/nestjs`. For transport-agnostic secure coding see `core/security-baseline`.

## Version check

- Read `@nestjs/microservices`, `@nestjs/bullmq`, `bullmq` and the transport client (`ioredis`, `@nats-io/transport-node`, `amqplib`, `kafkajs`, `@grpc/grpc-js`, `mqtt`) from the lockfile, and state the rule you're applying.
- `@nestjs/microservices` must match `@nestjs/core` and be ≥ 12.0.3 (TCP memory and nested-pattern fixes). Below 12, use `legacy/nestjs-legacy`.
- NATS on v12 uses `@nats-io/transport-node` and `@nats-io/nats-core` (NATS v3); the `nats` package is the v11 client.
- `@nestjs/bull` with `bull` is the legacy queue stack (Bull is in maintenance mode). Keep it in existing code; use BullMQ for every new queue and offer `upgrade-nestjs` for the move.

## Conventions

### Transports and clients

- Register clients with `ClientsModule.registerAsync()` and read hosts, ports and credentials from `ConfigService`. Never inline `process.env` reads in module metadata.
- Keep message patterns as constants in the shared library (`@app/common`), named `<service>.<action>`: `{ cmd: 'orders.create' }`, `'orders.created'` for events.
- Wrap each downstream service in one client class with typed methods (`NotificationsClient.sendWelcome(input)`). Controllers and services call the wrapper, never `ClientProxy` directly.
- `send()` is request-response and cold: nothing is sent until you subscribe. `emit()` is fire-and-forget and hot. Use `send()` only when you need the reply.
- Always add a timeout and convert to a promise:

  ```ts
  return firstValueFrom(
    this.client.send<OrderResult>(ORDER_PATTERNS.create, input).pipe(timeout(5_000)),
  );
  ```

- At the HTTP edge, map `TimeoutError` and RPC errors to HTTP exceptions (504, 502 or the mapped 4xx) in one place.
- Handlers: `@MessagePattern` returns a value; `@EventPattern` returns nothing and must be idempotent (brokers redeliver).
- Microservice handlers throw `RpcException`. On gRPC, throw the v12 `Grpc*Exception` classes (`GrpcNotFoundException`, …) and register `GrpcExceptionFilter` so clients get real status codes.
- Hybrid apps: `app.connectMicroservice(options, { inheritAppConfig: true })`, or global pipes, guards and filters don't apply to message handlers.

### Message validation

- Validate every payload like HTTP input. With Standard Schema: `@Payload({ schema: createOrderSchema })` and `StandardSchemaValidationPipe` registered on the microservice. With class-validator: a DTO and `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- Give the pipe an `exceptionFactory` that throws `RpcException`, so validation failures reach the caller as a client error instead of "Internal server error".
- Don't trust identity fields in the payload (`userId`, `tenantId`, `role`). Pass a signed token or rely on an authenticated peer (mTLS, broker credentials), and authorize in the receiving service.

### Real-time updates

Publish UI updates through one provider-neutral publisher, so the vendor (Pusher, Ably, Socket.IO, Redis pub/sub, SSE) can change without touching services:

```ts
export abstract class RealtimePublisher {
  abstract publish(channel: string, event: string, payload: RealtimePayload): Promise<void>;
}

// realtime.module.ts
providers: [{ provide: RealtimePublisher, useClass: PusherRealtimePublisher }],
exports: [RealtimePublisher],
```

- Keep channel and event names as constants in the shared library (`orders.updated`). Scope channels by tenant or user (`private-tenant-<id>-orders`).
- Authorize every private-channel subscription server-side: the auth endpoint checks the user may see that tenant or record.
- Publish after the database transaction commits, never inside it. Send IDs and the change type; let clients refetch through the authorized API. Never publish secrets or fields the subscriber couldn't read over HTTP.
- A failed publish logs and continues; it doesn't roll back the write. If delivery must be guaranteed, use an outbox table and a queue.

### Queues (BullMQ)

```ts
// queues.module.ts
BullModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({ connection: config.getOrThrow('redis') }),
}),
BullModule.registerQueue({ name: EMAIL_QUEUE }),

// email.producer.ts
await this.emailQueue.add('send-welcome', { userId }, {
  jobId: `welcome-${userId}`,
  attempts: 5,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: 1_000,
  removeOnFail: 5_000,
});

// email.processor.ts
@Processor(EMAIL_QUEUE, { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'send-welcome': {
        const { userId } = welcomeJobSchema.parse(job.data);
        await this.emailService.sendWelcome(userId);
        return;
      }
      default:
        throw new UnrecoverableError(`Unknown job ${job.name}`);
    }
  }
}
```

- **A processor must throw on failure.** Catching an error and returning (`return { success: false }`) marks the job completed, so `attempts` and `backoff` never run. If you catch to log or add context, rethrow.
- Throw `UnrecoverableError` (from `bullmq`) for failures a retry can't fix (invalid data, missing record) so the job fails without retrying.
- Set `attempts` and `backoff` on every job, or once in `defaultJobOptions`. Without `attempts`, a job runs once.
- Make jobs idempotent: a job may run more than once. Use `jobId` to deduplicate, and check state before side effects (charges, emails).
- Validate `job.data` with a schema at the start of `process()`. Put IDs in job data, not secrets, tokens or full PII records: Redis stores them in plain text.
- Log failures with `@OnWorkerEvent('failed')` and alert on jobs that exhaust their attempts. Cap retained jobs with `removeOnComplete` and `removeOnFail`.
- Repeating jobs: `queue.upsertJobScheduler()`; `Queue.add()` no longer takes `repeat`.
- Sandboxed processors (`processors: [path]`) run without dependency injection; use them only for CPU-heavy pure work.
- Call `app.enableShutdownHooks()` so workers finish or release active jobs on deploy.

## Security

Transport security. None of these authenticate callers by default; anyone who reaches the port or broker can call every handler.

| Transport | Default | Encrypt and authenticate with |
|---|---|---|
| TCP | **Plaintext, no auth** | `tlsOptions` (server `key`/`cert`; client `ca`). Add `requestCert: true` and `ca` on the server for mutual TLS. |
| Redis | Plaintext | ioredis `tls` options and a password or ACL user |
| NATS | Plaintext | `tls://` servers with `tls` options, plus user, token or NKey credentials |
| RabbitMQ | Plaintext | `amqps://` URLs and `socketOptions`; per-service broker users |
| Kafka | Plaintext | kafkajs `ssl: true` and `sasl`; topic ACLs |
| gRPC | Insecure credentials | `credentials`: `ServerCredentials.createSsl()` / `ChannelCredentials.createSsl()` |
| MQTT | Plaintext | `mqtts://` URL with broker auth |

- Use TLS (or mutual TLS) for every transport that leaves a single host. A private network alone is acceptable only for TCP between containers on one host or pod network, and say so in the summary.
- Never expose a microservice port publicly or through the API gateway's ingress. Bind to an internal interface.
- Lower the TCP `maxBufferSize` (default `(512 * 1024 * 1024) / 4`, about 134 million characters) to the largest real message, and limit payload nesting in schemas. Both 2026 TCP advisories were memory and recursion denial of service.
- RabbitMQ: set `noAck: false` and ack after the handler succeeds, so failures are redelivered; add a dead-letter queue to stop poison-message loops.
- Kafka: `kafkajs` has had no release since February 2023. Keep it where it works; ask the user before adding it to a new service.
- Each service gets its own broker and Redis credentials with only the permissions it needs.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Affected | Fixed |
|---|---|---|---|
| GHSA-96h4-vgxj-gvm2: unbounded memory growth in the TCP transport | @nestjs/microservices | < 11.2.5; 12.0.0–12.0.2 | 11.2.5 / 12.0.3 |
| CVE-2026-102281 (GHSA-m8vh-jmq9-5rjg): process crash from a deeply nested message pattern | @nestjs/microservices | < 11.2.4; 12.0.0–12.0.1 | 11.2.4 / 12.0.2 |
| CVE-2026-40879 (GHSA-hpwf-8g29-85qm): stack overflow via recursive `JsonSocket` handling (TCP) | @nestjs/microservices | < 11.1.19 | 11.1.19 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Unit-test handlers by calling the controller method with a payload; unit-test client wrappers with a mocked `ClientProxy` that returns `of(result)` and `throwError(() => new RpcException(...))`.
- Integration-test one round trip per transport against a real broker in a container (Testcontainers or Compose), with TLS on.
- Test that an invalid payload returns a client error, not a crash, and that an unknown pattern is rejected.
- Queues: test that a failing `process()` throws (the job lands in `failed` with `attemptsMade` > 1), that `UnrecoverableError` skips retries, and that a duplicate `jobId` doesn't run twice.
- Real-time: test that the channel auth endpoint refuses another tenant's channel.

## Before you finish

```sh
npx tsc --noEmit -p tsconfig.json
npm run lint
npm test
npm run test:e2e                     # if present
npm audit --audit-level=moderate
npm ls @nestjs/microservices bullmq  # @nestjs/microservices ≥ 12.0.3
grep -rnE "Transport\.TCP" --include='*.ts' apps src libs 2>/dev/null   # each hit has tlsOptions or a documented private-network reason
```
