-- Consolidated schema extracted from SAAS_DEVELOPER_GUIDE.md
-- Source section: Data Model -> Core Tables

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  passwordHash VARCHAR,
  name VARCHAR,
  phone VARCHAR,
  createdAt TIMESTAMP,
  status VARCHAR, -- ACTIVE, INACTIVE, INVITED
  lastLogin TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY,
  name VARCHAR,
  type VARCHAR, -- Company, Partnership, Sole Trader
  gstin VARCHAR,
  pan VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  pinCode VARCHAR,
  fiscalYearStart INT, -- 1-12
  fiscalYearEnd INT, -- 1-12
  currency VARCHAR DEFAULT 'INR',
  createdAt TIMESTAMP,
  createdBy UUID REFERENCES users(id),
  status VARCHAR -- ACTIVE, SUSPENDED, CLOSED
);

CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  organizationId UUID REFERENCES organizations(id),
  role VARCHAR, -- SUPER_ADMIN, ORG_ADMIN, ACCOUNTANT, MANAGER, AUDITOR, VIEWER
  status VARCHAR, -- ACTIVE, INVITED, INACTIVE
  invitedAt TIMESTAMP,
  acceptedAt TIMESTAMP,
  UNIQUE(userId, organizationId)
);

-- Created before transactions to support transactions.invoiceId foreign key.
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  invoiceNo VARCHAR,
  partyName VARCHAR,
  type VARCHAR, -- Revenue, Expense
  invoiceAmount DECIMAL(15,2),
  paidAmount DECIMAL(15,2),
  balanceDue DECIMAL(15,2),
  dueDate DATE,
  status VARCHAR, -- UNPAID, PARTIAL, PAID, OVERDUE
  createdBy UUID REFERENCES users(id),
  createdAt TIMESTAMP,
  matchedTransactionId UUID,
  matchedDate TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  date DATE,
  description VARCHAR,
  amount DECIMAL(15,2),
  isIncome BOOLEAN,
  accountingType VARCHAR, -- Revenue, Expense, Asset, Liability
  subtype VARCHAR,
  coaCode VARCHAR, -- Chart of Accounts code
  coaName VARCHAR, -- Chart of Accounts name
  bucketId UUID,
  vendorCustomerName VARCHAR,
  paymentMethod VARCHAR,
  bankAccountId UUID,
  invoiceId UUID REFERENCES invoices(id),
  status VARCHAR, -- DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
  approvalLevel VARCHAR, -- NONE, MANAGER, ADMIN
  approvedBy UUID REFERENCES users(id),
  approvalDate TIMESTAMP,
  gstRate INT, -- 5, 12, 18, 28
  gstAmount DECIMAL(15,2),
  taxableAmount DECIMAL(15,2),
  notes TEXT,
  createdBy UUID REFERENCES users(id),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  auditTrail JSONB -- Full history
);

CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY,
  transactionId UUID REFERENCES transactions(id),
  organizationId UUID REFERENCES organizations(id),
  approverRole VARCHAR,
  approverUserId UUID REFERENCES users(id),
  status VARCHAR, -- PENDING, APPROVED, REJECTED, INFO_REQUESTED
  amount DECIMAL(15,2),
  reason TEXT,
  approvalDate TIMESTAMP,
  createdAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations(id),
  userId UUID REFERENCES users(id),
  action VARCHAR, -- CREATE, UPDATE, DELETE, APPROVE, REJECT
  resource VARCHAR, -- transaction, invoice, user, etc
  resourceId UUID,
  changes JSONB, -- Before/after values
  timestamp TIMESTAMP,
  ipAddress VARCHAR
);

-- Add the reverse link after both tables exist.
ALTER TABLE invoices
ADD CONSTRAINT invoices_matchedtransactionid_fkey
FOREIGN KEY (matchedTransactionId)
REFERENCES transactions(id);
