# Vietnamese Payroll System - Complete Guide

## Overview

This is a comprehensive Vietnamese payroll system that integrates with the existing invoice and finance system. It follows Vietnamese labor laws and tax regulations for 2024.

## Features

### ✅ Core Features
- **Vietnamese Tax Compliance**: Progressive income tax calculation with 2024 tax brackets
- **Social Insurance (BHXH/BHYT/BHTN)**: Automatic calculation for both employee and employer contributions
- **Payroll Periods**: Monthly payroll cycle management
- **Invoice Integration**: Automatic invoice generation for salary payments
- **Working Days Calculation**: Proportional salary based on actual working days
- **Allowances & Bonuses**: Flexible allowance and bonus management
- **Deductions**: Support for advances, union fees, and other deductions

### 🧮 Vietnamese Calculations
- **BHXH (Social Insurance)**: 8% employee, 17.5% employer
- **BHYT (Health Insurance)**: 1.5% employee, 3% employer  
- **BHTN (Unemployment Insurance)**: 1% employee, 1% employer
- **Personal Income Tax**: Progressive rates from 5% to 35%
- **Personal Deduction**: 11,000,000 VND/month (2024)
- **Dependent Deduction**: 4,400,000 VND per dependent (2024)

## Database Schema

### Tables Created
1. **payroll_periods**: Manages monthly payroll cycles
2. **payroll_records**: Individual employee payroll records
3. **vn_tax_brackets**: Vietnamese tax brackets for 2024

### Key Functions
- `calculate_vietnamese_social_insurance()`: Calculates BHXH/BHYT/BHTN
- `calculate_vietnamese_income_tax()`: Calculates progressive income tax
- `create_payroll_invoice()`: Generates invoice from payroll record

## Installation & Setup

### 1. Database Setup
```bash
# Run the payroll schema
psql -d your_database -f scripts/vietnamese-payroll-system.sql
```

### 2. Test the System
```bash
# Test all payroll functionality
node scripts/test-payroll-system.js
```

### 3. Add to Dashboard
The PayrollTab component is ready to be integrated into your dashboard.

## API Endpoints

### Payroll Periods
- `GET /api/payroll/periods` - List all payroll periods
- `POST /api/payroll/periods` - Create new payroll period

### Payroll Records  
- `GET /api/payroll/records` - List payroll records (with filters)
- `POST /api/payroll/records` - Create new payroll record
- `PUT /api/payroll/records` - Update payroll record

### Invoice Generation
- `POST /api/payroll/generate-invoice` - Generate invoice from payroll record

## Usage Guide

### 1. Create Payroll Period
```javascript
// Create monthly payroll period
const period = {
  period_name: "Tháng 01/2024",
  start_date: "2024-01-01", 
  end_date: "2024-01-31"
};
```

### 2. Create Payroll Record
```javascript
// Create employee payroll record
const payrollRecord = {
  employee_id: "uuid",
  payroll_period_id: "uuid",
  base_salary: 15000000,
  working_days: 26,
  actual_working_days: 24,
  allowances: {
    transport: 500000,
    lunch: 300000,
    phone: 200000
  },
  bonuses: {
    performance: 1000000,
    holiday: 500000
  },
  other_deductions: {
    advance: 500000,
    union_fee: 10000
  },
  dependents: 2
};
```

### 3. Generate Invoice
```javascript
// Generate salary invoice
const invoice = await generateInvoice(payrollRecordId);
```

## Salary Calculation Example

For an employee with:
- Base salary: 15,000,000 VND
- Working days: 24/26
- Allowances: 1,000,000 VND
- 2 dependents

**Calculation:**
1. **Proportional Salary**: (15,000,000 ÷ 26) × 24 = 13,846,154 VND
2. **Gross Salary**: 13,846,154 + 1,000,000 = 14,846,154 VND
3. **Social Insurance**: 
   - BHXH: 14,846,154 × 8% = 1,187,692 VND
   - BHYT: 14,846,154 × 1.5% = 222,692 VND
   - BHTN: 14,846,154 × 1% = 148,462 VND
4. **Taxable Income**: 14,846,154 - 1,558,846 = 13,287,308 VND
5. **Income Tax**: Progressive calculation with 2 dependents
6. **Net Salary**: Gross - Social Insurance - Income Tax - Other Deductions

## Integration with Invoice System

The payroll system automatically creates invoices for salary payments:

- **Invoice Type**: `payroll`
- **Is Income**: `false` (expense for company)
- **Invoice Items**: Detailed breakdown of salary components
- **Status**: `approved` (ready for payment)

## Vietnamese Compliance Features

### Tax Brackets (2024)
| Income Range (VND) | Tax Rate | Deduction (VND) |
|-------------------|----------|-----------------|
| 0 - 5,000,000 | 5% | 0 |
| 5,000,000 - 10,000,000 | 10% | 250,000 |
| 10,000,000 - 18,000,000 | 15% | 750,000 |
| 18,000,000 - 32,000,000 | 20% | 1,650,000 |
| 32,000,000 - 52,000,000 | 25% | 3,250,000 |
| 52,000,000 - 80,000,000 | 30% | 5,850,000 |
| 80,000,000+ | 35% | 9,850,000 |

### Social Insurance Limits (2024)
- **Maximum Base**: 29,800,000 VND/month
- **Minimum Base**: 4,680,000 VND/month (regional minimum wage)

## Frontend Components

### PayrollTab.tsx
Main component with three tabs:
1. **Kỳ lương (Periods)**: Manage payroll periods
2. **Bảng lương (Records)**: Create and view payroll records  
3. **Báo cáo (Reports)**: Payroll reports (future feature)

### Key Features
- Vietnamese currency formatting
- Responsive design
- Real-time calculations
- Invoice generation integration
- Comprehensive form validation

## Testing

Run the test script to verify all functionality:

```bash
node scripts/test-payroll-system.js
```

The test covers:
- Database schema verification
- Social insurance calculations
- Income tax calculations
- Payroll record creation
- Invoice generation
- API endpoint testing

## Troubleshooting

### Common Issues

1. **Database Functions Not Found**
   - Ensure you've run the SQL schema file
   - Check if functions exist: `\df calculate_vietnamese_*`

2. **Tax Calculation Errors**
   - Verify tax brackets are loaded: `SELECT * FROM vn_tax_brackets;`
   - Check if year parameter matches current year

3. **Invoice Generation Fails**
   - Ensure invoice system is properly set up
   - Check if employee has valid data

### Debug Commands
```sql
-- Check payroll tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'payroll_%';

-- Test social insurance calculation
SELECT * FROM calculate_vietnamese_social_insurance(15000000);

-- Test income tax calculation  
SELECT calculate_vietnamese_income_tax(13000000, 2);
```

## Future Enhancements

- [ ] Payroll reports and analytics
- [ ] Bulk payroll processing
- [ ] Payroll approval workflow
- [ ] Integration with attendance system
- [ ] Payslip generation (PDF)
- [ ] Bank transfer integration
- [ ] Year-end tax reporting

## Support

For issues or questions:
1. Check the test script output
2. Review database logs
3. Verify API responses
4. Check frontend console for errors

---

**Note**: This system is designed for Vietnamese labor law compliance as of 2024. Tax rates and regulations may change - please update accordingly.
