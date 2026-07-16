package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.TransactionDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionService {
    List<TransactionDTO> getAllTransactions();
    List<TransactionDTO> getTransactionsByDateRange(LocalDateTime start, LocalDateTime end);
    List<TransactionDTO> getTransactionsByAccount(Long accountId);
    TransactionDTO getTransactionById(Long id);
    TransactionDTO createTransaction(TransactionDTO transactionDTO);
    TransactionDTO updateTransaction(Long id, TransactionDTO transactionDTO);
    void deleteTransaction(Long id);
}
