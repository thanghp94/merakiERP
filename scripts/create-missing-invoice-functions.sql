-- Create missing functions for invoice system

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');
    current_month := TO_CHAR(NOW(), 'MM');
    
    SELECT COALESCE(MAX(
        CASE 
            WHEN invoice_number ~ ('^INV-' || current_year || current_month || '-[0-9]+$')
            THEN SUBSTRING(invoice_number FROM LENGTH('INV-' || current_year || current_month || '-') + 1)::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM invoices;

    invoice_num := 'INV-' || current_year || current_month || '-' || LPAD(sequence_num::TEXT, 4, '0');

    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set invoice number automatically
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice totals (simplified version without status dependency)
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    invoice_subtotal DECIMAL(15,2);
    invoice_tax DECIMAL(15,2);
    invoice_total DECIMAL(15,2);
    invoice_record RECORD;
BEGIN
    -- Get invoice_id (works for both INSERT and DELETE)
    IF TG_OP = 'DELETE' THEN
        SELECT * INTO invoice_record FROM invoices WHERE id = OLD.invoice_id;
    ELSE
        SELECT * INTO invoice_record FROM invoices WHERE id = NEW.invoice_id;
    END IF;

    -- Calculate subtotal from invoice items
    SELECT COALESCE(SUM(total_amount), 0)
    INTO invoice_subtotal
    FROM invoice_items
    WHERE invoice_id = invoice_record.id;

    -- Calculate tax and total
    invoice_tax := invoice_subtotal * (invoice_record.tax_rate / 100);
    invoice_total := invoice_subtotal + invoice_tax - invoice_record.discount_amount;

    -- Update invoice totals
    UPDATE invoices
    SET
        subtotal = invoice_subtotal,
        tax_amount = invoice_tax,
        total_amount = invoice_total,
        updated_at = NOW()
    WHERE id = invoice_record.id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO anon;
GRANT EXECUTE ON FUNCTION set_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION update_invoice_totals() TO authenticated;
