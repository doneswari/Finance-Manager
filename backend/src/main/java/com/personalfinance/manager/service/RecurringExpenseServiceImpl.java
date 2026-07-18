package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.RecurringExpenseDTO;
import com.personalfinance.manager.dto.TransactionDTO;
import com.personalfinance.manager.exception.ResourceNotFoundException;
import com.personalfinance.manager.model.*;
import com.personalfinance.manager.repository.RecurringExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecurringExpenseServiceImpl implements RecurringExpenseService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final CategoryService categoryService;
    private final AccountService accountService;
    private final UserService userService;
    private final TransactionService transactionService;

    public RecurringExpenseServiceImpl(
            RecurringExpenseRepository recurringExpenseRepository,
            CategoryService categoryService,
            AccountService accountService,
            UserService userService,
            TransactionService transactionService) {
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.categoryService = categoryService;
        this.accountService = accountService;
        this.userService = userService;
        this.transactionService = transactionService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpenseDTO> getAllRecurringExpenses() {
        User currentUser = userService.getCurrentUser();
        return recurringExpenseRepository.findByUserIdOrderByNextDueDateAsc(currentUser.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RecurringExpenseDTO createRecurringExpense(RecurringExpenseDTO dto) {
        User currentUser = userService.getCurrentUser();
        Category category = categoryService.getCategoryEntity(dto.getCategoryId());
        Account fromAccount = accountService.getAccountEntity(dto.getFromAccountId());

        RecurringExpense recurringExpense = RecurringExpense.builder()
                .name(dto.getName())
                .amount(dto.getAmount())
                .nextDueDate(dto.getNextDueDate())
                .frequency(dto.getFrequency())
                .lastPaidDate(dto.getLastPaidDate())
                .category(category)
                .fromAccount(fromAccount)
                .user(currentUser)
                .build();

        RecurringExpense saved = recurringExpenseRepository.save(recurringExpense);
        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public void deleteRecurringExpense(Long id) {
        User currentUser = userService.getCurrentUser();
        RecurringExpense entity = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring Expense not found with id: " + id));

        if (!entity.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Recurring Expense not found with id: " + id);
        }

        recurringExpenseRepository.delete(entity);
    }

    @Override
    @Transactional
    public TransactionDTO payRecurringExpense(Long id) {
        User currentUser = userService.getCurrentUser();
        RecurringExpense entity = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring Expense not found with id: " + id));

        if (!entity.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Recurring Expense not found with id: " + id);
        }

        // Create transaction of type EXPENSE
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .description("Recurring: " + entity.getName())
                .amount(entity.getAmount())
                .date(LocalDate.now().atStartOfDay()) // Paid today
                .type(TransactionType.EXPENSE)
                .categoryId(entity.getCategory().getId())
                .fromAccountId(entity.getFromAccount().getId())
                .build();

        TransactionDTO createdTransaction = transactionService.createTransaction(transactionDTO);

        // Advance next due date based on frequency
        LocalDate oldDueDate = entity.getNextDueDate();
        LocalDate newDueDate;
        switch (entity.getFrequency()) {
            case DAILY:
                newDueDate = oldDueDate.plusDays(1);
                break;
            case WEEKLY:
                newDueDate = oldDueDate.plusWeeks(1);
                break;
            case MONTHLY:
                newDueDate = oldDueDate.plusMonths(1);
                break;
            case YEARLY:
                newDueDate = oldDueDate.plusYears(1);
                break;
            default:
                newDueDate = oldDueDate.plusMonths(1);
        }

        entity.setNextDueDate(newDueDate);
        entity.setLastPaidDate(LocalDate.now());
        recurringExpenseRepository.save(entity);

        return createdTransaction;
    }

    private RecurringExpenseDTO convertToDTO(RecurringExpense r) {
        return RecurringExpenseDTO.builder()
                .id(r.getId())
                .name(r.getName())
                .amount(r.getAmount())
                .nextDueDate(r.getNextDueDate())
                .frequency(r.getFrequency())
                .lastPaidDate(r.getLastPaidDate())
                .categoryId(r.getCategory().getId())
                .categoryName(r.getCategory().getName())
                .fromAccountId(r.getFromAccount().getId())
                .fromAccountName(r.getFromAccount().getName())
                .build();
    }
}
