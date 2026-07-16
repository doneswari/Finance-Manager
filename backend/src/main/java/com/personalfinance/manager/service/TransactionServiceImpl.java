package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.TransactionDTO;
import com.personalfinance.manager.exception.BadRequestException;
import com.personalfinance.manager.exception.ResourceNotFoundException;
import com.personalfinance.manager.model.*;
import com.personalfinance.manager.repository.AccountRepository;
import com.personalfinance.manager.repository.TransactionRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final AccountService accountService;
    private final CategoryService categoryService;
    private final UserService userService;
    private final BudgetService budgetService;

    public TransactionServiceImpl(
            TransactionRepository transactionRepository,
            AccountRepository accountRepository,
            AccountService accountService,
            CategoryService categoryService,
            UserService userService,
            @Lazy BudgetService budgetService) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.accountService = accountService;
        this.categoryService = categoryService;
        this.userService = userService;
        this.budgetService = budgetService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionDTO> getAllTransactions() {
        User currentUser = userService.getCurrentUser();
        return transactionRepository.findByUserIdOrderByDateDesc(currentUser.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionDTO> getTransactionsByDateRange(LocalDateTime start, LocalDateTime end) {
        User currentUser = userService.getCurrentUser();
        return transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(currentUser.getId(), start, end).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionDTO> getTransactionsByAccount(Long accountId) {
        User currentUser = userService.getCurrentUser();
        // verify account exists and belongs to user
        accountService.getAccountEntity(accountId);
        return transactionRepository.findByUserIdAndAccountId(currentUser.getId(), accountId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDTO getTransactionById(Long id) {
        User currentUser = userService.getCurrentUser();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        return convertToDTO(transaction);
    }

    @Override
    @Transactional
    public TransactionDTO createTransaction(TransactionDTO dto) {
        User currentUser = userService.getCurrentUser();
        Category category = categoryService.getCategoryEntity(dto.getCategoryId());
        
        // Build entity
        Transaction transaction = Transaction.builder()
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .date(dto.getDate() != null ? dto.getDate() : LocalDateTime.now())
                .type(dto.getType())
                .category(category)
                .user(currentUser)
                .build();

        // Process Accounts & Balances
        applyBalanceChanges(transaction, dto.getFromAccountId(), dto.getToAccountId());

        Transaction saved = transactionRepository.save(transaction);

        // Update Budgets if Expense
        if (saved.getType() == TransactionType.EXPENSE) {
            budgetService.updateBudgetOnExpense(saved.getAmount(), saved.getCategory().getId(), saved.getDate().toLocalDate());
        }

        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public TransactionDTO updateTransaction(Long id, TransactionDTO dto) {
        User currentUser = userService.getCurrentUser();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        // 1. Reverse previous balance impact
        reverseBalanceChanges(transaction);

        // 2. Reverse previous budget impact if old transaction was expense
        if (transaction.getType() == TransactionType.EXPENSE) {
            budgetService.updateBudgetOnExpense(transaction.getAmount().negate(), transaction.getCategory().getId(), transaction.getDate().toLocalDate());
        }

        // 3. Update transaction fields
        Category category = categoryService.getCategoryEntity(dto.getCategoryId());
        transaction.setDescription(dto.getDescription());
        transaction.setAmount(dto.getAmount());
        transaction.setDate(dto.getDate() != null ? dto.getDate() : LocalDateTime.now());
        transaction.setType(dto.getType());
        transaction.setCategory(category);

        // 4. Apply new balance impact
        applyBalanceChanges(transaction, dto.getFromAccountId(), dto.getToAccountId());

        Transaction saved = transactionRepository.save(transaction);

        // 5. Apply new budget impact if new transaction is expense
        if (saved.getType() == TransactionType.EXPENSE) {
            budgetService.updateBudgetOnExpense(saved.getAmount(), saved.getCategory().getId(), saved.getDate().toLocalDate());
        }

        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public void deleteTransaction(Long id) {
        User currentUser = userService.getCurrentUser();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        // Reverse balance impact
        reverseBalanceChanges(transaction);

        // Reverse budget impact if it was expense
        if (transaction.getType() == TransactionType.EXPENSE) {
            budgetService.updateBudgetOnExpense(transaction.getAmount().negate(), transaction.getCategory().getId(), transaction.getDate().toLocalDate());
        }

        transactionRepository.delete(transaction);
    }

    private void applyBalanceChanges(Transaction transaction, Long fromAccountId, Long toAccountId) {
        if (transaction.getType() == TransactionType.EXPENSE) {
            if (fromAccountId == null) {
                throw new BadRequestException("Source Account (fromAccountId) is required for EXPENSE");
            }
            Account fromAccount = accountService.getAccountEntity(fromAccountId);
            fromAccount.setBalance(fromAccount.getBalance().subtract(transaction.getAmount()));
            accountRepository.save(fromAccount);
            transaction.setFromAccount(fromAccount);
            transaction.setToAccount(null);
            
        } else if (transaction.getType() == TransactionType.INCOME) {
            if (toAccountId == null) {
                throw new BadRequestException("Destination Account (toAccountId) is required for INCOME");
            }
            Account toAccount = accountService.getAccountEntity(toAccountId);
            toAccount.setBalance(toAccount.getBalance().add(transaction.getAmount()));
            accountRepository.save(toAccount);
            transaction.setToAccount(toAccount);
            transaction.setFromAccount(null);
            
        } else if (transaction.getType() == TransactionType.TRANSFER) {
            if (fromAccountId == null || toAccountId == null) {
                throw new BadRequestException("Both Source and Destination Accounts are required for TRANSFER");
            }
            if (fromAccountId.equals(toAccountId)) {
                throw new BadRequestException("Source and Destination Accounts must be different for TRANSFER");
            }
            Account fromAccount = accountService.getAccountEntity(fromAccountId);
            Account toAccount = accountService.getAccountEntity(toAccountId);
            
            fromAccount.setBalance(fromAccount.getBalance().subtract(transaction.getAmount()));
            toAccount.setBalance(toAccount.getBalance().add(transaction.getAmount()));
            
            accountRepository.save(fromAccount);
            accountRepository.save(toAccount);
            
            transaction.setFromAccount(fromAccount);
            transaction.setToAccount(toAccount);
        }
    }

    private void reverseBalanceChanges(Transaction transaction) {
        if (transaction.getType() == TransactionType.EXPENSE && transaction.getFromAccount() != null) {
            Account fromAccount = transaction.getFromAccount();
            fromAccount.setBalance(fromAccount.getBalance().add(transaction.getAmount()));
            accountRepository.save(fromAccount);
            
        } else if (transaction.getType() == TransactionType.INCOME && transaction.getToAccount() != null) {
            Account toAccount = transaction.getToAccount();
            toAccount.setBalance(toAccount.getBalance().subtract(transaction.getAmount()));
            accountRepository.save(toAccount);
            
        } else if (transaction.getType() == TransactionType.TRANSFER && transaction.getFromAccount() != null && transaction.getToAccount() != null) {
            Account fromAccount = transaction.getFromAccount();
            Account toAccount = transaction.getToAccount();
            
            fromAccount.setBalance(fromAccount.getBalance().add(transaction.getAmount()));
            toAccount.setBalance(toAccount.getBalance().subtract(transaction.getAmount()));
            
            accountRepository.save(fromAccount);
            accountRepository.save(toAccount);
        }
    }

    private TransactionDTO convertToDTO(Transaction t) {
        return TransactionDTO.builder()
                .id(t.getId())
                .description(t.getDescription())
                .amount(t.getAmount())
                .date(t.getDate())
                .type(t.getType())
                .categoryId(t.getCategory().getId())
                .categoryName(t.getCategory().getName())
                .fromAccountId(t.getFromAccount() != null ? t.getFromAccount().getId() : null)
                .fromAccountName(t.getFromAccount() != null ? t.getFromAccount().getName() : null)
                .toAccountId(t.getToAccount() != null ? t.getToAccount().getId() : null)
                .toAccountName(t.getToAccount() != null ? t.getToAccount().getName() : null)
                .build();
    }
}
