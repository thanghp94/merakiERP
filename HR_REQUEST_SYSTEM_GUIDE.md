# HR Request & Approval System Guide

## Overview

The HR Request & Approval System is a comprehensive solution for managing Vietnamese HR and administrative requests in an education company. It supports four main request types with dynamic workflows and approval processes.

## Features

### ✅ Completed Features

#### 1. Database Schema
- **Enhanced `requests` table** with Vietnamese request types
- **`request_comments` table** for discussions and notes
- **Proper indexing** for performance optimization
- **Row Level Security (RLS)** policies for data protection

#### 2. Request Types Supported
1. **Nghỉ phép** (Leave Request)
   - From/to dates
   - Total days calculation
   - Reason for leave

2. **Đổi lịch** (Schedule Change)
   - Original and new dates
   - Affected classes
   - Reason for change

3. **Tạm ứng** (Advance Payment)
   - Amount requested
   - Repayment plan
   - Reason for advance

4. **Mua sắm/Sửa chữa** (Purchase/Repair)
   - Item name and description
   - Estimated cost
   - Vendor information
   - Justification

#### 3. Status Workflow
- `pending` → Initial status when request is created
- `approved` → Request has been approved by HR/Admin
- `rejected` → Request has been denied
- `in_progress` → For purchase/repair requests being processed
- `completed` → Final status when request is fulfilled

#### 4. API Endpoints
- `GET /api/requests` - List and filter requests
- `POST /api/requests` - Create new request
- `GET /api/requests/[id]` - Get request details with comments
- `PATCH /api/requests/[id]` - Update request status
- `GET /api/requests/[id]/comments` - Get request comments
- `POST /api/requests/[id]/comments` - Add comment to request

#### 5. User Interface
- **RequestsTab** integrated into HCNS dashboard section
- **Status overview cards** showing request counts
- **Advanced filtering** by status, type, and search
- **Responsive data table** with Vietnamese labels
- **Basic modal placeholders** for future enhancements

## Installation & Setup

### 1. Database Migration

Run the database migration to create the required tables:

```bash
# Using psql
psql -d your_database_name -f scripts/create-hr-request-system.sql

# Or using Supabase CLI
supabase db push
```

### 2. Environment Setup

Ensure your environment variables are configured:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Test the System

Run the test script to verify everything works:

```bash
node scripts/test-hr-request-system.js
```

## Usage Guide

### For Employees

1. **Navigate to Dashboard** → HCNS → Yêu cầu
2. **View Status Overview** - See counts of all request types
3. **Filter Requests** - Use filters to find specific requests
4. **Create New Request** - Click "Tạo yêu cầu mới" (placeholder for now)
5. **View Details** - Click "Xem chi tiết" on any request

### For HR/Admin Users

1. **Review Requests** - Access all employee requests
2. **Filter by Status** - Focus on pending requests
3. **Approve/Reject** - Update request status (via API)
4. **Add Comments** - Provide feedback and notes
5. **Track Progress** - Monitor request workflow

## API Usage Examples

### Create a Leave Request

```javascript
const response = await fetch('/api/requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    request_type: 'nghi_phep',
    title: 'Xin nghỉ phép thăm gia đình',
    description: 'Tôi xin phép được nghỉ để về thăm gia đình.',
    request_data: {
      from_date: '2024-02-15',
      to_date: '2024-02-17',
      reason: 'Thăm gia đình',
      total_days: 3
    },
    created_by_employee_id: 'employee-uuid'
  })
});
```

### Approve a Request

```javascript
const response = await fetch(`/api/requests/${requestId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'approved',
    approver_employee_id: 'hr-employee-uuid'
  })
});
```

### Add a Comment

```javascript
const response = await fetch(`/api/requests/${requestId}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    comment: 'Yêu cầu đã được xem xét và phê duyệt.',
    employee_id: 'hr-employee-uuid'
  })
});
```

## Database Schema

### Requests Table

```sql
CREATE TABLE requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type VARCHAR(50) CHECK (request_type IN ('nghi_phep', 'doi_lich', 'tam_ung', 'mua_sam_sua_chua')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    request_data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
    created_by_employee_id UUID REFERENCES employees(id),
    approver_employee_id UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Request Comments Table

```sql
CREATE TABLE request_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(request_id),
    employee_id UUID REFERENCES employees(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security & Permissions

### Row Level Security (RLS) Policies

1. **Employees** can:
   - View their own requests
   - Create new requests
   - Update their pending requests
   - Comment on their own requests

2. **HR/Admin** can:
   - View all requests
   - Update any request status
   - Comment on any request
   - Approve/reject requests

3. **Managers** can:
   - Approve/reject requests in their department
   - View requests from their team members

## Future Enhancements

### 🔄 Planned Features

1. **Enhanced Modal Components**
   - Dynamic request creation forms
   - Rich request detail views with comments
   - Approval workflow UI

2. **Notification System**
   - Email notifications for status changes
   - In-app notifications
   - Slack/Zalo integration

3. **Advanced Features**
   - Request templates
   - Bulk operations
   - Reporting and analytics
   - Mobile app support

4. **Workflow Improvements**
   - Multi-level approval
   - Conditional routing
   - Automated reminders
   - Integration with calendar systems

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check Supabase credentials
   - Verify network connectivity
   - Ensure RLS policies are correctly set

2. **Request Creation Fails**
   - Validate required fields
   - Check employee ID exists
   - Verify request_data format

3. **UI Not Loading**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Ensure proper authentication

### Debug Commands

```bash
# Test database connection
node scripts/test-hr-request-system.js

# Check API endpoints
curl -X GET http://localhost:3000/api/requests

# Verify database tables
psql -d your_database -c "SELECT * FROM requests LIMIT 5;"
```

## Support

For technical support or feature requests:

1. Check the TODO.md file for current development status
2. Review the test script output for system health
3. Consult the API documentation for endpoint details
4. Check the browser console for client-side errors

## Contributing

When contributing to this system:

1. Follow the existing code patterns
2. Update tests when adding new features
3. Maintain Vietnamese language consistency
4. Document any new API endpoints
5. Update this guide with new features

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Status:** Production Ready (Basic Features)
