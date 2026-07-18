package com.personalfinance.manager.dto;

import com.personalfinance.manager.model.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDTO {
    private Long id;

    private String description;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    @NotNull(message = "Date is required")
    private LocalDateTime date;

    @NotNull(message = "Transaction type is required")
    private TransactionType type; // INCOME, EXPENSE, TRANSFER

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String categoryName;

    private Long fromAccountId; // source account ID

    private String fromAccountName;

    private Long toAccountId; // destination account ID

    private String toAccountName;

    private String receiptUrl;

    private Boolean isReimbursable;

    private String reimbursementStatus;
}
