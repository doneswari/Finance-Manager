package com.personalfinance.manager.dto;

import com.personalfinance.manager.model.RecurrenceFrequency;
import jakarta.validation.constraints.NotBlank;
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
public class RecurringExpenseDTO {

    private Long id;

    @NotBlank(message = "Name/Description is required")
    private String name;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    @NotNull(message = "Next due date is required")
    private LocalDate nextDueDate;

    @NotNull(message = "Frequency is required")
    private RecurrenceFrequency frequency;

    private LocalDate lastPaidDate;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String categoryName;

    @NotNull(message = "Source Account ID is required")
    private Long fromAccountId;

    private String fromAccountName;
}
