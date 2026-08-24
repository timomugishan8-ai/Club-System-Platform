# Database

MySQL schema + seed for the Data Science Chapter Tracker.

## Setup

1. Start MySQL, then run the schema:

   ```bash
   mysql -u root -p < schema.sql
   ```

2. Load the seed data (roles, committees, badges, tier thresholds, default admin):

   ```bash
   mysql -u root -p < seed.sql
   ```

3. Configure the backend `.env` (see `backend/.env`):

   ```
   DB_HOST=localhost
   DB_USER=<your_mysql_user>
   DB_PASSWORD=<your_mysql_password>
   DB_NAME=ds_chapter_tracker
   ```

## Default Admin

- Email: `admin@dschapter.org`
- Password: `Admin@1234` — change it after first login.

## Files

- `schema.sql` — all tables, indexes, foreign keys.
- `seed.sql` — roles, committees, participation types, badges, system settings, default admin.
- `erd.drawio` — entity-relationship diagram (legacy).