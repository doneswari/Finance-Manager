package com.personalfinance.manager.dto;

import com.personalfinance.manager.model.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDTO {
    private Long id;

    @NotBlank(message = "Category name is required")
    private String name;

    @NotNull(message = "Category type (INCOME/EXPENSE) is required")
    private TransactionType type;

    private Boolean isDefault;
}
