-- Insert test user with hashed password
INSERT INTO "users" ("id", "name", "kode", "password", "role", "email_verified", "image")
VALUES (
  gen_random_uuid(),
  'Super Admin',
  '24031993',
  '$2b$10$bw.chsnqyoFeUUcmcpesxuwz1TEnLtaIlbWtKuzPUkQDzLJnCZdua',
  'SUPER_ADMIN',
  NULL,
  NULL
) ON CONFLICT ("kode") DO NOTHING;
