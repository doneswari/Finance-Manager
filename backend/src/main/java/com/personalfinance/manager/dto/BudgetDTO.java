package com.personalfinance.manager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetDTO {
    private Long id;

    @NotNull(message = "Limit amount is required")
    @Positive(message = "Limit amount must be positive")
    private BigDecimal limitAmount;

    private BigDecimal currentAmount;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;



    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String categoryName;
    
    private Boolean isExceeded; // Derived field
}
