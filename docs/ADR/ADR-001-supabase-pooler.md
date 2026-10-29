# ADR-001: Supabase PostgreSQL Connection via Session Pooler (Port 6543)

## Status
Accepted

## Context
Supabase provisioned databases in cloud environments (e.g. AWS eu-west-1 Dublin) allocate direct database domain names (`db.[project-ref].supabase.co`) with IPv6-only `AAAA` DNS records. Many consumer ISPs, local development machines, and cloud environments like Render web services operate on IPv4-only networks or lack complete IPv6 routing. Attempting direct connections on port 5432 resulted in `getaddrinfo ENOTFOUND` or connection timeouts. Furthermore, serverless and dynamic web applications risk exhausting PostgreSQL connection limits without connection pooling.

## Decision
We connect to Supabase PostgreSQL strictly through the AWS region pooler endpoint (`aws-0-[region].pooler.supabase.com`) on **Port 6543** using the standard Node.js `pg.Pool` driver with SSL encryption enabled (`rejectUnauthorized: false`). The connection username format is `postgres.[project-ref]`.

## Consequences
### Positive
- Reliable IPv4 dual-stack routing universally accessible from Render, local machines, and CI environments.
- Safe connection reuse and multiplexing via PgBouncer session mode.
- Complete compliance with Hard Constraint C1: accessed strictly as a standard Postgres instance using `pg`, with zero Supabase client libraries or auth dependencies.

### Trade-offs
- Passwords containing special characters (e.g., `@`, `%`) must be percent-encoded (`%40`) in `DATABASE_URL`.
