package com.personalfinance.manager.repository;

import com.personalfinance.manager.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    
    List<Budget> findByUserId(Long userId);
    
    Optional<Budget> findByIdAndUserId(Long id, Long userId);
    
    @Query("SELECT b FROM Budget b WHERE b.user.id = :userId AND b.category.id = :categoryId AND :date BETWEEN b.startDate AND b.endDate")
    Optional<Budget> findActiveBudget(@Param("userId") Long userId, @Param("categoryId") Long categoryId, @Param("date") LocalDate date);
}
