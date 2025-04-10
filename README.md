# Scribe.Dev

This is a Node.js backend project powered by [Yarn](https://yarnpkg.com/), [Prisma ORM](https://www.prisma.io/), and [PostgreSQL](https://www.postgresql.org/).
It includes features for data modeling, database migration, and API server setup.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:Manoo07/Scribe.Dev.Backend.git
```

```bash
cd Scribe.Dev.Backend
```

---

### 2. Configure Environment Variables

- Create a `.env` file in the root directory.
- Use `.env.example` as a reference:

```bash
cp .env.example .env
```

- Add your PostgreSQL connection string to the `.env` file:

```
DATABASE_URL="postgresql://username:password@localhost:5432/your-db-name"
```

---

### 3. Install Dependencies

```bash
yarn
```

---

### 4. Prisma Setup

#### Generate Migrations

```bash
npx prisma migrate dev --name init
```

#### Generate Prisma Client

```bash
npx prisma generate
```

#### Open Prisma Studio (Optional)

To visualize and interact with your database tables:

```bash
npx prisma studio
```

---

### 5. Run the Development Server

```bash
yarn dev
```

The server should now be running at `http://localhost:3000` (or your configured port).

---

## Additional Notes

- If you update your Prisma models in `schema.prisma`, rerun:
  - `npx prisma migrate dev --name your-migration-name`
  - `npx prisma generate`
- Make sure PostgreSQL is running before running migrations or starting the server.

---

## Tech Stack

- Node.js
- Yarn
- Prisma ORM
- PostgreSQL

---

If you ever want to add a **Contributing** section or **API Documentation**, just let me know and I can help draft that too!
