# Database Optimization Guide (Scale to 1M+ Users)

To ensure the application remains performant as the user base grows to 1,000,000+ users, the following database optimizations must be applied.

## 1. B-Tree Indexing for `user_id`
Because almost every query in the app filters by `user_id` (via RLS or explicit `.eq('user_id', user.id)` calls), every table must have a B-Tree index on the `user_id` column. Without this, PostgreSQL will perform a "Full Table Scan," which becomes exponentially slower as the number of rows increases.

### SQL Setup Script
Run this in the Supabase SQL Editor:

```sql
-- Create indexes for all tax tables to optimize user-specific queries
CREATE INDEX IF NOT EXISTS idx_tax_paye_user_id ON tax_paye(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_vat_user_id ON tax_vat(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_wht_user_id ON tax_wht(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_cgt_user_id ON tax_cgt(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_cit_user_id ON tax_cit(user_id);

-- Create index for profiles table (assuming 'id' is the primary key and indexed)
-- If not the PK, use: CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
```

## 2. Row Level Security (RLS) Optimization
To keep RLS overhead low, we use the most efficient policy pattern:
- **Pattern**: `auth.uid() = user_id`
- **Why**: This avoids joining other tables or calling expensive functions during the authorization check.

## 3. Connection Management (Supavisor)
When hitting 100k+ concurrent users, the number of active database connections will exceed the standard Postgres limit.
- **Solution**: Use **Supavisor** (Supabase's connection pooler).
- **Implementation**: Update the connection string in the app to use the pooler port (6543) instead of the direct Postgres port (5432) if necessary.

## 4. Read Replicas
For read-heavy operations (like viewing tax history for a million users), consider:
- **Solution**: Setting up a **Read Replica** in the Supabase dashboard to distribute the load across multiple database instances.
