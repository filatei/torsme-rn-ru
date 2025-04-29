// types/expense.ts
export interface Product {
    name: string;
    description?: string;
    category?: string;
    qty?: number;
    unit?: string;
    price?: number;
    amount?: number;
}

export interface Note {
    text?: string;
    author?: string;
    date?: Date;
    image?: string;
}

export interface PaymentHistory {
    bankAcct?: string;
    paymentDate?: Date;
    memo?: string;
    paidAmount?: number;
    date?: Date;
    payer?: string;
}

export interface StatusHistory {
    oldStatus?: string;
    newStatus?: string;
    updater?: string;
    date?: Date;
}

export type DeliveryStatus = "DELIVERED" | "NOT DELIVERED";

export type ExpenseStatus =
    | "DRAFT"
    | "VALIDATED"
    | "REVIEWED"
    | "OPEN"
    | "APPROVED"
    | "PART-PAY"
    | "PAID"
    | "DECLINED";

export interface Expense {
    _id: string;
    products: Product[];
    notes: Note[];
    log: any[];
    vendor?: { name?: string }; // ObjectId as string
    creator?: string; // ObjectId as string
    updater?: string; // ObjectId as string
    site?: string;
    company?: string;
    deliveryStatus?: DeliveryStatus;
    status?: ExpenseStatus;
    approvalComment?: string;
    title?: string;
    category?: string;
    expenseAccount?: string;
    payment?: any;
    payHistory: PaymentHistory[];
    statusHistory: StatusHistory[];
    date?: Date;
    type?: string;
    txn_amount?: number;
    balance?: number;
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
    dateStr?: string;
    memo?: string;
}
