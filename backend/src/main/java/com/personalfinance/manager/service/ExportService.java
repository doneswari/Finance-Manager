package com.personalfinance.manager.service;

public interface ExportService {
    byte[] exportTransactionsToExcel();
    byte[] exportTransactionsToPdf();
}
