-- Keep Product's derived columns in step with their sources, for every writer.
--
-- `effectivePrice` and `inStock` exist because ordering by an expression is not
-- expressible through Prisma's `orderBy`, and the shop sorts by the sale-aware price and
-- sinks sold-out products on every request.
--
-- Maintaining them in application code means every writer has to remember: the
-- repository, the seed, a data migration, a manual UPDATE in psql. The seed forgot on its
-- first run, which silently reduced price sorting to a name sort. A BEFORE trigger moves
-- the guarantee into the database, where it cannot be bypassed.

CREATE OR REPLACE FUNCTION product_sync_derived_columns() RETURNS trigger AS $$
BEGIN
  NEW."effectivePrice" := COALESCE(NEW."salePrice", NEW."price");
  NEW."inStock" := NEW."stock" > 0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_sync_derived_columns_trigger ON "Product";

CREATE TRIGGER product_sync_derived_columns_trigger
  BEFORE INSERT OR UPDATE ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION product_sync_derived_columns();

-- Backfill anything written before the trigger existed.
UPDATE "Product"
SET "effectivePrice" = COALESCE("salePrice", "price"),
    "inStock" = "stock" > 0;
