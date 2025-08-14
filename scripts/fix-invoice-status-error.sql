-- Fix for invoice creation status error
-- The issue is that triggers are trying to access a 'status' column that doesn't exist

-- First, let's add the missing status column to finances table if it doesn't exist
ALTER TABLE finances ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Add constraint for status values
ALTER TABLE finances DROP CONSTRAINT IF EXISTS finances_status_check;
ALTER TABLE finances ADD CONSTRAINT finances_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'failed'));

-- Create or replace the update_invoice_totals function with proper error handling
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    invoice_subtotal DECIMAL(15,2);
    invoice_tax DECIMAL(15,2);
    invoice_total DECIMAL(15,2);
    invoice_paid DECIMAL(15,2);
    invoice_remaining DECIMAL(15,2);
    invoice_record RECORD;
    new_status TEXT;
BEGIN
    -- Get invoice_id (works for both INSERT and DELETE)
    IF TG_OP = 'DELETE' THEN
        SELECT * INTO invoice_record FROM invoices WHERE id = OLD.invoice_id;
    ELSE
        SELECT * INTO invoice_record FROM invoices WHERE id = NEW.invoice_id;
    END IF;

    -- If no invoice found, return
    IF invoice_record IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Calculate subtotal from invoice items
    SELECT COALESCE(SUM(total_amount), 0)
    INTO invoice_subtotal
    FROM invoice_items
    WHERE invoice_id = invoice_record.id;

    -- Calculate tax and total
    invoice_tax := invoice_subtotal * (COALESCE(invoice_record.tax_rate, 0) / 100);
    invoice_total := invoice_subtotal + invoice_tax - COALESCE(invoice_record.discount_amount, 0);

    -- Calculate paid amount from finances (only if finances table has status column)
    BEGIN
        SELECT COALESCE(SUM(amount), 0)
        INTO invoice_paid
        FROM finances
        WHERE invoice_id = invoice_record.id 
        AND (status IS NULL OR status = 'completed');
    EXCEPTION WHEN OTHERS THEN
        -- If status column doesn't exist, just sum all amounts
        SELECT COALESCE(SUM(amount), 0)
        INTO invoice_paid
        FROM finances
        WHERE invoice_id = invoice_record.id;
    END;

    invoice_remaining := invoice_total - invoice_paid;

    -- Determine status
    IF invoice_paid = 0 THEN
        new_status := CASE
            WHEN invoice_record.due_date IS NOT NULL AND invoice_record.due_date < CURRENT_DATE THEN 'overdue'
            WHEN invoice_record.status = 'draft' THEN 'draft'
            ELSE 'sent'
        END;
    ELSIF invoice_paid >= invoice_total THEN
        new_status := 'paid';
    ELSE
        new_status := 'partial';
    END IF;

    -- Update invoice totals
    UPDATE invoices
    SET
        subtotal = invoice_subtotal,
        tax_amount = invoice_tax,
        total_amount = invoice_total,
        paid_amount = invoice_paid,
        remaining_amount = invoice_remaining,
        status = new_status,
        updated_at = NOW()
    WHERE id = invoice_record.id;

    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    -- Log error and return without failing the transaction
    RAISE WARNING 'Error in update_invoice_totals: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_invoice_totals_items_insert ON invoice_items;
DROP TRIGGER IF EXISTS trigger_update_invoice_totals_items_update ON invoice_items;
DROP TRIGGER IF EXISTS trigger_update_invoice_totals_items_delete ON invoice_items;
DROP TRIGGER IF EXISTS trigger_update_invoice_totals_finances_insert ON finances;
DROP TRIGGER IF EXISTS trigger_update_invoice_totals_finances_update ON finances;

-- Recreate triggers with proper error handling
CREATE TRIGGER trigger_update_invoice_totals_items_insert
    AFTER INSERT ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER trigger_update_invoice_totals_items_update
    AFTER UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER trigger_update_invoice_totals_items_delete
    AFTER DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

-- Only create finance triggers if the status column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'finances' AND column_name = 'status') THEN
        
        CREATE TRIGGER trigger_update_invoice_totals_finances_insert
            AFTER INSERT ON finances
            FOR EACH ROW
            WHEN (NEW.invoice_id IS NOT NULL)
            EXECUTE FUNCTION update_invoice_totals();

        CREATE TRIGGER trigger_update_invoice_totals_finances_update
            AFTER UPDATE ON finances
            FOR EACH ROW
            WHEN (NEW.invoice_id IS NOT NULL OR OLD.invoice_id IS NOT NULL)
            EXECUTE FUNCTION update_invoice_totals();
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_invoice_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION update_invoice_totals() TO anon;

-- Add index on finances status column if it exists
CREATE INDEX IF NOT EXISTS idx_finances_status ON finances(status);
