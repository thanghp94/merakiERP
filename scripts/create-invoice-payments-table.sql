-- Create invoice_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_date ON invoice_payments(payment_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoice_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_payments_updated_at ON invoice_payments;
CREATE TRIGGER trigger_update_invoice_payments_updated_at
    BEFORE UPDATE ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payments_updated_at();

-- Create function to update invoice paid_amount and status when payments are added/updated/deleted
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    invoice_total DECIMAL(15,2);
    total_paid DECIMAL(15,2);
    invoice_status VARCHAR(20);
BEGIN
    -- Get the invoice_id from either NEW or OLD record
    DECLARE
        target_invoice_id UUID;
    BEGIN
        IF TG_OP = 'DELETE' THEN
            target_invoice_id := OLD.invoice_id;
        ELSE
            target_invoice_id := NEW.invoice_id;
        END IF;
        
        -- Get invoice total
        SELECT total_amount INTO invoice_total
        FROM invoices 
        WHERE id = target_invoice_id;
        
        -- Calculate total paid amount
        SELECT COALESCE(SUM(amount), 0) INTO total_paid
        FROM invoice_payments 
        WHERE invoice_id = target_invoice_id;
        
        -- Determine status
        IF total_paid = 0 THEN
            invoice_status := 'draft';
        ELSIF total_paid >= invoice_total THEN
            invoice_status := 'paid';
        ELSE
            invoice_status := 'partial';
        END IF;
        
        -- Update invoice
        UPDATE invoices 
        SET 
            paid_amount = total_paid,
            remaining_amount = invoice_total - total_paid,
            status = invoice_status,
            updated_at = NOW()
        WHERE id = target_invoice_id;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for payment status updates
DROP TRIGGER IF EXISTS trigger_payment_insert_update_invoice ON invoice_payments;
CREATE TRIGGER trigger_payment_insert_update_invoice
    AFTER INSERT ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();

DROP TRIGGER IF EXISTS trigger_payment_update_update_invoice ON invoice_payments;
CREATE TRIGGER trigger_payment_update_update_invoice
    AFTER UPDATE ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();

DROP TRIGGER IF EXISTS trigger_payment_delete_update_invoice ON invoice_payments;
CREATE TRIGGER trigger_payment_delete_update_invoice
    AFTER DELETE ON invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();

-- Add RLS policies for invoice_payments
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view all payments
CREATE POLICY "Users can view all invoice payments" ON invoice_payments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert payments
CREATE POLICY "Users can insert invoice payments" ON invoice_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update payments
CREATE POLICY "Users can update invoice payments" ON invoice_payments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete payments
CREATE POLICY "Users can delete invoice payments" ON invoice_payments
    FOR DELETE USING (auth.role() = 'authenticated');
