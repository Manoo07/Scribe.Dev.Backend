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

### 6. Applying Prisma Migrations Locally

- Use the following command to apply any pending migrations to the local database:

```bash
npx prisma migrate deploy
```

- After applying the migrations, regenerate the `Prisma Client` to reflect the updated schema:

```bash
npx prisma generate
```

### 7. Seeding the Database

After setting up your database and running migrations, you can populate it with initial (sample) data using the Prisma seed script.

- Ensure your database is running and migrations are applied.
- Run the seed command:

```bash
npx prisma db seed
```

This will execute the seed script defined in your package.json (`prisma/seed.ts`), inserting temporary data into your database.

Inspect the Seeded Data:

- Use Prisma Studio to visually check your seeded data:

```bash
npx prisma studio
```

## Additional Notes

- If you update your Prisma models in `schema.prisma`, rerun:
  ```bash
  npx prisma migrate dev --name your-migration-name
  ```
- To generate the prisma client we need to run :
  ```bash
  npx prisma generate
  ```
- Make sure PostgreSQL is running before running migrations or starting the server.

---

## Tech Stack

- Node.js
- Yarn
- Prisma ORM
- PostgreSQL

---

If you ever want to add a **Contributing** section or **API Documentation**, just let me know and I can help draft that too!
