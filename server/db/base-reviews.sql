-- Purpose: BaseReviews schema for PCS Express community intelligence.
-- Third-party dependencies: PostgreSQL with pgcrypto for gen_random_uuid().
-- Security posture: Stores public review metadata only. Raw .mil emails, orders,
-- DoD ID numbers, phone numbers, home addresses, and documents are excluded.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS BaseReviews (
  ReviewId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  InstallationName TEXT NOT NULL CHECK (char_length(InstallationName) BETWEEN 2 AND 160),
  Category TEXT NOT NULL CHECK (Category IN ('Housing', 'Schools', 'Childcare')),
  Rating NUMERIC(2,1) NOT NULL CHECK (Rating >= 1.0 AND Rating <= 5.0),
  UserRank TEXT NOT NULL CHECK (UserRank ~ '^(E|O|W)-[1-9]0?$'),
  ReviewText TEXT CHECK (ReviewText IS NULL OR char_length(ReviewText) <= 1200),
  MilitaryFamilyVerified BOOLEAN NOT NULL DEFAULT FALSE,
  VerificationMethod TEXT NOT NULL DEFAULT 'none' CHECK (VerificationMethod IN ('none', 'mil_email', 'verified_orders', 'admin_review')),
  VerificationTokenHash TEXT,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT BaseReviews_NoRawEmail CHECK (ReviewText IS NULL OR ReviewText !~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}'),
  CONSTRAINT BaseReviews_NoLikelyDodId CHECK (ReviewText IS NULL OR ReviewText !~ '\\m[0-9]{10}\\M')
);

CREATE INDEX IF NOT EXISTS idx_base_reviews_installation_category
  ON BaseReviews (InstallationName, Category);

CREATE INDEX IF NOT EXISTS idx_base_reviews_verified
  ON BaseReviews (MilitaryFamilyVerified, VerificationMethod);

COMMENT ON TABLE BaseReviews IS 'Public community review metadata for base intelligence. Do not store raw PII, orders, uploaded files, addresses, phone numbers, or DoD identifiers.';
COMMENT ON COLUMN BaseReviews.InstallationName IS 'Public installation name selected from onboarding or verified user input.';
COMMENT ON COLUMN BaseReviews.Category IS 'Review category: Housing, Schools, or Childcare.';
COMMENT ON COLUMN BaseReviews.Rating IS 'Community rating from 1.0 to 5.0.';
COMMENT ON COLUMN BaseReviews.UserRank IS 'Reviewer rank only, not name or DoD ID.';
COMMENT ON COLUMN BaseReviews.MilitaryFamilyVerified IS 'True only after .mil email verification or verified orders workflow; raw artifacts are not stored in this table.';
