# ADR-004: Server-Side Filtering, Search, Sorting, and Pagination via SQL

## Status
Accepted

## Context
Client-side filtering requires fetching entire datasets into browser memory, creating severe bandwidth waste, memory bloat on mobile devices, and data leakage of unviewed inquiries. Furthermore, naive SQL queries without proper indexes or using raw string interpolation create critical SQL injection vulnerabilities and slow linear table scans ($O(N)$).

## Decision
1. **Server-Side Execution**: All filtering (category, userType, status), text search, date bounding, sorting, and pagination happen strictly within PostgreSQL in the repository layer.
2. **Positional Parameterization**: 100% of dynamic values are bound via `$1`, `$2`, etc. No user-supplied strings are ever interpolated into SQL statements.
3. **Identifier Whitelisting**: Sort fields (`createdAt`, `name`, `status`, `category`, `userType`) and sort directions (`asc`, `desc`) are mapped against hardcoded whitelists. Any unapproved value is rejected with HTTP 400.
4. **Trigram & Generated Column Search**:
   - Name searches use PostgreSQL's `pg_trgm` GIN index (`idx_inquiries_name_trgm`), allowing instantaneous case-insensitive substring matching.
   - Phone searches strip non-digit characters (`+`, spaces, dashes) and match against the stored generated column `phone_digits` via a B-Tree index.
5. **Single-Pass Window Counting**: Instead of two separate database round-trips for the list and total count, the query utilizes `COUNT(*) OVER() AS full_count`.
