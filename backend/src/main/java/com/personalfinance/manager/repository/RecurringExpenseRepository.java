package com.personalfinance.manager.repository;

import com.personalfinance.manager.model.RecurringExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, Long> {
    List<RecurringExpense> findByUserIdOrderByNextDueDateAsc(Long userId);
}
