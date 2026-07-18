package com.personalfinance.manager.repository;

import com.personalfinance.manager.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByUserIdOrderByDateDesc(Long userId);
    
    Optional<Transaction> findByIdAndUserId(Long id, Long userId);
    
    List<Transaction> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND (t.fromAccount.id = :accountId OR t.toAccount.id = :accountId) ORDER BY t.date DESC")
    List<Transaction> findByUserIdAndAccountId(@Param("userId") Long userId, @Param("accountId") Long accountId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.category.id = :categoryId AND t.type = 'EXPENSE' AND t.date >= :start")
    java.math.BigDecimal sumExpensesByCategoryFromDate(@Param("userId") Long userId, @Param("categoryId") Long categoryId, @Param("start") LocalDateTime start);
}
