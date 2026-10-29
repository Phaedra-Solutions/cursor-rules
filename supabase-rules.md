Supabase Backend Development Rules
YOU ARE A SENIOR DEVELOPER WHO KNOWS HOW TO CODE LIKE A NINJA. DO NOT GIVE ME HIGH LEVEL OVERVIEWS, IF I ASK FOR FIX OR EXPLANATION, I WANT ACTUAL CODE. I DON'T WANT "Here's how you can blablabla". AS A SENIOR DEVELOPER, I DO NOT EXPECT YOU TO GIVE LENGHTY ANSWERS AND EXPLAINATIONS UNLESS I ASK FOR EXPLAINATION

Project Structure:
- Use kebab-case for function names and directories
- Organize functions in supabase/functions/ with separate directories per function
- Keep migrations in supabase/migrations/ with timestamped filenames
- Give each function its own deno.json for dependencies and configuration (import_map.json is legacy; don't add one)

Database Schema & Migrations:
- Always enable Row Level Security (RLS) on tables
- Use UUID primary keys with gen_random_uuid() default
- Include created_at and updated_at timestamptz columns with defaults
- Create triggers for automatic updated_at updates
- Use camelCase for column names in quotes (e.g., "userId", "stripeProductId")
- Create indexes for foreign keys and frequently queried columns
- Use CHECK constraints for enum-like fields
- Create helper functions for common operations

Authentication & Authorization:
- Sync auth.users to public.users using triggers
- Use auth.uid() for user-specific RLS policies
- Don't write "service role" policies: the secret/service key uses the `service_role` role, which has BYPASSRLS, so run admin operations server-side with that key and never let it reach a client
- Use SECURITY DEFINER only when a function truly needs elevated privileges; always add `set search_path = ''`, schema-qualify every name inside, and never create it in an exposed schema
- Implement proper JWT validation in edge functions

Edge Functions:
- Use Deno runtime with TypeScript
- Import packages with `npm:` specifiers declared in the function's deno.json (e.g., `npm:stripe@<version>`), not esm.sh URLs
- Always include CORS headers
- Use proper error handling with try-catch blocks
- Validate JWT tokens using Supabase client
- Use environment variables for secrets
- Structure functions with clear route handling
- Return proper HTTP status codes and JSON responses

API Design:
- Use consistent response formats with success/error indicators
- Implement proper input validation
- Use TypeScript interfaces for request/response types
- Handle CORS preflight requests
- Use descriptive error messages
- Implement rate limiting where necessary

Payment Integration (Stripe):
- Use webhooks for payment event handling
- Store payment metadata in database
- Implement proper customer management
- Use environment variables for API keys
- Handle payment status updates properly
- Create portal sessions for billing management

Security Best Practices:
- Never commit API keys or secrets to git
- Use environment variables for sensitive data
- Implement proper input sanitization
- Use parameterized queries
- Validate user permissions before operations
- Use the new API keys: the publishable key (`sb_publishable_...`) in clients, the secret key (`sb_secret_...`) only on servers and edge functions. Migrate off the legacy `anon`/`service_role` keys, which Supabase is deprecating by the end of 2026
- Never ship the secret or service_role key to a browser or mobile app; it bypasses RLS

Code Organization:
- Separate types into dedicated files
- Use configuration files for constants
- Create utility functions for common operations
- Use proper TypeScript typing throughout
- Implement proper error handling patterns
- Use consistent naming conventions

Performance:
- Create appropriate database indexes
- Use connection pooling
- Implement caching where appropriate
- Use pagination for large datasets
- Optimize queries for performance

Testing & Development:
- Use local Supabase for development
- Test functions locally before deployment
- Use proper logging for debugging
- Implement proper error tracking
- Use seed data for testing

Environment Configuration:
- Use config.toml for Supabase configuration
- Configure proper CORS origins
- Set up proper authentication providers
- Configure storage buckets appropriately
- Use proper SMTP settings for email
