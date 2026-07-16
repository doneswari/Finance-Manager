package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.BudgetDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface BudgetService {
    List<BudgetDTO> getAllBudgets();
    BudgetDTO getBudgetById(Long id);
    BudgetDTO createBudget(BudgetDTO budgetDTO);
    BudgetDTO updateBudget(Long id, BudgetDTO budgetDTO);
    void deleteBudget(Long id);
    void updateBudgetOnExpense(BigDecimal amount, Long categoryId, LocalDate date);
}
