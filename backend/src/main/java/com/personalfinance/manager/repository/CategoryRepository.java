package com.personalfinance.manager.repository;

import com.personalfinance.manager.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByIsDefaultTrue();
    List<Category> findByUserId(Long userId);
    
    @Query("SELECT c FROM Category c WHERE c.isDefault = true OR c.user.id = :userId")
    List<Category> findAllDefaultAndCustomByUserId(@Param("userId") Long userId);
    
    Optional<Category> findByIdAndUserId(Long id, Long userId);
    
    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.isDefault = true OR c.user.id = :userId)")
    Optional<Category> findByIdAndIsDefaultOrUserId(@Param("id") Long id, @Param("userId") Long userId);
}
