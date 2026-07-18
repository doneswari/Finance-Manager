package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.RecurringExpenseDTO;
import com.personalfinance.manager.dto.TransactionDTO;

import java.util.List;

public interface RecurringExpenseService {
    List<RecurringExpenseDTO> getAllRecurringExpenses();
    RecurringExpenseDTO createRecurringExpense(RecurringExpenseDTO dto);
    void deleteRecurringExpense(Long id);
    TransactionDTO payRecurringExpense(Long id);
}
