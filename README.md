# SeatSniper — Online Ticket Booking System

![CI](https://github.com/dev-ayush101/seat-sniper/actions/workflows/ci.yml/badge.svg)

A system design implementation of an online ticket booking platform, inspired by Ticketmaster. Built to demonstrate handling of seat reservations, distributed locking, real-time updates, concurrent booking scenarios, JWT authentication, and role-based access control.

For the full system design breakdown, see the [HLD notes](https://github.com/dev-ayush101/ReadmeForLife/blob/main/hld-problems/TicketMaster%20-%20Event%20Booking%20Platform.md).

## Tech Stack

- **Backend:** Spring Boot 3, Java 17, Spring Security
- **Frontend:** React 18, Vite, Tailwind CSS
- **Database:** PostgreSQL 15
- **Cache/Locking:** Redis 7
- **Search:** Elasticsearch 8.17
- **Auth:** JWT (access + refresh tokens), bcrypt
- **Migrations:** Flyway
- **Containerization:** Docker Compose
- **CI:** GitHub Actions

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Environment Setup

Create a `.env` file in the project root:

```bash
JWT_SECRET=<your-base64-encoded-64-byte-secret>
```

Generate a secret:

```bash
openssl rand -base64 64 | tr -d '\n'
```

Docker Compose reads the `.env` file automatically. For GitHub Actions CI, add `JWT_SECRET` as a repository secret.

### Run (Docker — recommended)

```bash
docker-compose up --build
```

This starts everything — PostgreSQL, Redis, Elasticsearch, backend, and frontend. The backend waits for Elasticsearch to be healthy before starting.

Frontend: `http://localhost:3000` | Backend: `http://localhost:8080`

### Run (Local development)

```bash
# start infrastructure
docker-compose up -d postgres redis elasticsearch

# start backend (terminal 1)
./mvnw spring-boot:run

# start frontend (terminal 2)
cd frontend
npm install
npm run dev
```

### Run Tests

```bash
# all tests (requires PG, Redis, ES running)
./mvnw test

# individual test suites
./mvnw test -Dtest=ConcurrencyTest
./mvnw test -Dtest=EdgeCaseTest
```

## Features

### Authentication

- Email + password registration and login with JWT
- Access token (15 min) + refresh token (7 days) pattern
- Passwords hashed with bcrypt
- Input validation: email format, password rules (min 7 chars, uppercase, lowercase, number, special character)
- Axios interceptor auto-attaches Bearer token to all API requests
- Frontend auth state managed via React Context with jwt-decode

### Role-Based Access Control (RBAC)

- Two roles: `USER` and `ADMIN`
- `@PreAuthorize("hasRole('ADMIN')")` secures all admin endpoints
- Admin can promote other users to admin via the admin panel

### Admin Panel

- **Events** — create events with auto-generated tickets (tiered pricing), edit, delete
- **Venues** — create and edit venues (seat map auto-generated from capacity)
- **Performers** — create and edit performers
- **Bookings** — view all bookings with color-coded status badges
- **User Management** — update user roles

### Booking System

- Virtual waiting queue for high-demand events
- Real-time seat map with SSE updates
- Redis distributed lock for seat reservations (10 min TTL)
- Automatic booking expiry — stale `IN_PROGRESS` bookings marked `EXPIRED` via scheduled task
- Tiered pricing — front rows premium, middle standard, back economy

## Frontend

The React frontend has the following pages:

- **Home** — search bar with event cards, click any card to view the event
- **Login** — email + password login with show/hide password toggle
- **Register** — registration with password strength hints and validation
- **Event** — waiting room queue → seat map with real-time availability via SSE
- **Checkout** — 10-minute countdown timer mirroring the Redis lock TTL, mock payment form, confirm booking
- **Admin** — tabbed admin panel (events, bookings, venues, performers) — admin only

### Seat Map Color Coding

| Color | Meaning |
|-------|---------|
| Green outline | Available — click to select |
| Green filled | Selected by you |
| Yellow | Reserved by another user |
| Gray | Sold |

### User Flow

1. Register or log in (JWT tokens stored in localStorage)
2. Search or browse events on the home page (fuzzy search powered by Elasticsearch)
3. Click an event → join the virtual waiting queue (auto-uses logged-in email)
4. Wait for admission (position updates via SSE) → seat map loads automatically
5. Select one or more seats → sticky bottom bar shows total price
6. Click "Book Now" → seats are locked in Redis for 10 minutes
7. Fill payment details on the checkout page (mock)
8. Click "Pay" → booking confirmed, tickets marked as BOOKED
9. If you don't pay within 10 minutes, the reservation expires and seats are released

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email, password, name |
| POST | `/api/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | Exchange refresh token for new token pair |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/:eventId` | View event details with seat map and tickets |
| GET | `/api/events/search?keyword=&start=&end=&page=&size=` | Search events (Elasticsearch fuzzy match) |
| GET | `/api/events/:eventId/stream` | SSE stream for real-time seat updates |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/:eventId` | Reserve tickets (locks seats for 10 min) |
| POST | `/api/bookings/:bookingId/confirm?userEmail=` | Confirm booking after payment |

### Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/queue/:eventId/join?userEmail=` | Join the waiting queue |
| GET | `/api/queue/:eventId/status?userEmail=` | Check queue position / admission |
| GET | `/api/queue/:eventId/stream?userEmail=` | SSE stream for queue position updates |

### Admin (requires ADMIN role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/events` | List all events |
| POST | `/api/admin/events` | Create event with auto-generated tickets |
| PUT | `/api/admin/events/:id` | Update event |
| DELETE | `/api/admin/events/:id` | Delete event |
| GET | `/api/admin/venues` | List all venues |
| POST | `/api/admin/venues` | Create venue (seat map auto-generated) |
| PUT | `/api/admin/venues/:id` | Update venue (seat map regenerated if capacity changes) |
| GET | `/api/admin/performers` | List all performers |
| POST | `/api/admin/performers` | Create performer |
| PUT | `/api/admin/performers/:id` | Update performer |
| GET | `/api/admin/bookings` | List all bookings |
| PUT | `/api/admin/users/:email/role` | Update user role |

#### Example: Register

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "ayush@test.com",
  "password": "Test@123",
  "name": "Ayush"
}
```

```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

#### Example: Search Events

```bash
GET /api/events/search?keyword=coldplay
```

```json
{
  "content": [
    {
      "id": "c2222222-...",
      "name": "Music of the Spheres",
      "description": "Coldplay world tour London show",
      "eventDate": "2024-01-20T20:00:00",
      "eventType": "CONCERT",
      "venue": { "name": "Wembley Stadium", "capacity": 80 },
      "performer": { "name": "Coldplay" }
    }
  ],
  "page": { "size": 10, "number": 0, "totalElements": 1, "totalPages": 1 }
}
```

#### Example: Fuzzy Search (typo-tolerant)

```bash
GET /api/events/search?keyword=tayler
```

Returns Taylor Swift's event despite the typo — Elasticsearch fuzzy matching handles it.

#### Example: Reserve Tickets

```bash
POST /api/bookings/c2222222-2222-2222-2222-222222222222
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
Content-Type: application/json

{
  "ticketIds": ["d7717724-f01d-4dab-bd84-5c0fbe9a492a"],
  "userEmail": "ayush@test.com"
}
```

```json
{
  "id": "5cd9443e-...",
  "userEmail": "ayush@test.com",
  "totalPrice": 120.00,
  "status": "IN_PROGRESS",
  "tickets": [
    { "section": "A", "rowName": "4", "seatNumber": 9, "price": 120.00, "status": "AVAILABLE" }
  ]
}
```

#### Example: Confirm Booking

```bash
POST /api/bookings/5cd9443e-.../confirm?userEmail=ayush@test.com
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

```json
{
  "id": "5cd9443e-...",
  "status": "CONFIRMED",
  "tickets": [
    { "section": "A", "rowName": "4", "seatNumber": 9, "price": 120.00, "status": "BOOKED" }
  ]
}
```

#### Example: Error — Ticket Already Booked

```bash
POST /api/bookings/c2222222-.../
{ "ticketIds": ["d7717724-..."], "userEmail": "other@test.com" }
```

```json
{ "error": "Ticket d7717724-... is not available" }
```

## Architecture

```mermaid
flowchart LR
    C[Client] <--> AG

    subgraph GW["API Gateway"]
        AG["Auth, Rate Limiting, Routing"]
    end

    subgraph Services
        AS["Auth Service"]
        ES["Event Service"]
        SS["Search Service"]
        BS["Booking Service"]
        QS["Queue Service"]
    end

    AG -->|"POST /auth"| AS
    AG -->|"GET /events/:id"| ES
    AG -->|"GET /events/search"| SS
    AG -->|"POST /bookings"| BS
    AG -->|"POST /queue/join"| QS

    AS <--> DB[(PostgreSQL)]
    ES <--> DB
    SS <--> Search[("Elasticsearch\nFuzzy Search")]
    BS <--> DB
    BS <--> Redis[("Redis\nDistributed Lock\nTTL: 10 min")]
    QS <--> Redis
    BS -.->|"SSE seat-update"| C
    QS -.->|"SSE queue-update"| C
    DB -->|"sync on startup"| Search
```

### Authentication Flow

1. User registers or logs in → backend issues JWT access token (15 min) + refresh token (7 days)
2. Access token contains claims: `sub` (email), `role`, `iat`, `exp`
3. `JwtAuthFilter` extracts and validates token on every request, sets `SecurityContext`
4. Protected endpoints check `SecurityContext` for authentication and role
5. Frontend stores tokens in localStorage, Axios interceptor auto-attaches Bearer header

### Booking Flow

1. User selects seats → `POST /bookings/:eventId` reserves tickets
2. Redis lock acquired per ticket (`SET ticket:lock:{id} NX EX 600`) — 10 min TTL
3. Reserved ticket IDs added to a Redis sorted set (`ZADD event:{id}:reserved <expiresAt> ticketId`)
4. SSE broadcasts `RESERVED` status to all connected viewers
5. User completes payment → `POST /bookings/:bookingId/confirm` marks tickets as BOOKED
6. If user abandons checkout, Redis TTL expires — next seat map load cleans stale entries via `ZREMRANGEBYSCORE`
7. Scheduled task runs every 10 mins, marks stale `IN_PROGRESS` bookings (>10 min) as `EXPIRED`

### Virtual Waiting Queue

For high-demand events, users enter a Redis-backed queue before accessing the seat map:

1. User joins queue → `ZADD queue:event:{id} <timestamp> userEmail`
2. Background job runs every 5 seconds, admits users in batches of 10
3. Admitted users added to `admitted:event:{id}` set — only they can reserve tickets
4. SSE pushes live position updates to waiting users

### Reservation Expiry (No Cron Needed)

The DB only stores two ticket states: `AVAILABLE` and `BOOKED`. Temporary reservations live entirely in Redis:

- **Write path:** lock acquired via `SET NX EX`, ticket ID added to sorted set with `expiresAt` as score
- **Read path:** `ZREMRANGEBYSCORE` removes expired entries, `ZRANGEBYSCORE` returns active reservations, seat map overlays `RESERVED` status in-memory
- **Result:** expired reservations vanish automatically on next page load — no background cleanup required
- **Booking cleanup:** scheduled task marks stale `IN_PROGRESS` booking records as `EXPIRED` every 60 seconds

### Ticket Auto-Generation

When an admin creates an event, tickets are automatically generated from the venue's seat map:

- Seat map is auto-generated from venue capacity (10 seats per row)
- Tiered pricing based on row position: front rows at 2.5x base price, middle rows at 1.5x, back rows at base price
- Updating venue capacity regenerates the seat map (affects future events only)

### Key Design Decisions

- **JWT over sessions** — stateless authentication, no server-side session store, scales horizontally
- **Access + refresh token pattern** — short-lived access tokens limit exposure, refresh tokens provide seamless UX
- **bcrypt** for password hashing — adaptive cost factor, resistant to brute force
- **@PreAuthorize over URL-based rules** — method-level security is more granular and self-documenting
- **DTOs for request bodies** — prevents mass assignment vulnerabilities, decouples API contract from entity
- **Redis distributed lock** over DB-level locks for ticket reservation — automatic TTL expiry, no cron jobs needed
- **Redis sorted set** for reservation read path — scores are expiry timestamps, stale entries cleaned lazily
- **Elasticsearch** for search — fuzzy matching, typo tolerance, inverted index instead of SQL `ILIKE`
- **SSE (Server-Sent Events)** for real-time seat map and queue updates — lightweight, unidirectional, no WebSocket overhead
- **Virtual waiting queue** — controls traffic flow during high-demand events, prevents system overload
- **Tiered pricing** — front rows cost more, back rows cheaper, auto-calculated from base price
- **Shared database** across services — data is tightly coupled (bookings need tickets need events), ACID transactions required

## Testing

### Concurrency Test

Simulates 10 users trying to book the same seat simultaneously. Verifies that Redis `SET NX` ensures exactly 1 user succeeds and 9 are rejected — no double booking.

### Edge Case Tests

- **Already booked ticket** — rejects reservation for a sold seat
- **Invalid ticket ID** — rejects reservation with a non-existent ticket
- **Double confirm** — rejects confirming an already-confirmed booking

## Data Model

- **User** — email (unique), password (nullable for future OAuth), name, role (USER/ADMIN), auth provider (LOCAL)
- **Venue** — name, address, capacity, seat map (JSONB, auto-generated)
- **Performer** — name, description, image URL
- **Event** — links to venue + performer, date, type
- **Ticket** — per-seat record with section, row, seat number, price, status (AVAILABLE / BOOKED)
- **Booking** — groups tickets under one purchase with user email and status (IN_PROGRESS / CONFIRMED / CANCELLED / EXPIRED)

## Seed Data

Comes with 3 pre-loaded events:

| Event | Venue | Performer | Tickets |
|-------|-------|-----------|---------|
| Eras Tour NYC | Madison Square Garden | Taylor Swift | 80 seats |
| Music of the Spheres | Wembley Stadium | Coldplay | 80 seats |
| Arijit Live NYC | Madison Square Garden | Arijit Singh | 80 seats |