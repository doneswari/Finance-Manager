package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.AccountDTO;
import com.personalfinance.manager.dto.CategoryDTO;
import com.personalfinance.manager.dto.TransactionDTO;
import com.personalfinance.manager.model.AccountType;
import com.personalfinance.manager.model.TransactionType;
import com.personalfinance.manager.model.User;
import com.personalfinance.manager.repository.UserRepository;
import com.personalfinance.manager.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Transactional
public class TransactionServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountService accountService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private TransactionService transactionService;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Seed default categories
        categoryService.seedDefaultCategories();

        // Create and save test user
        testUser = User.builder()
                .username("testuser")
                .email("testuser@example.com")
                .password("password123")
                .role("ROLE_USER")
                .build();
        testUser = userRepository.save(testUser);

        // Authenticate user in SecurityContext
        CustomUserDetails userDetails = new CustomUserDetails(testUser);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    void testCreateExpenseTransactionUpdatesAccountBalance() {
        // 1. Create a bank account with initial balance $1000.00
        AccountDTO accountDTO = AccountDTO.builder()
                .name("Checking Account")
                .type(AccountType.BANK)
                .balance(new BigDecimal("1000.00"))
                .currency("USD")
                .build();
        AccountDTO createdAccount = accountService.createAccount(accountDTO);
        assertNotNull(createdAccount.getId());

        // 2. Fetch a default category (e.g., Food & Dining)
        List<CategoryDTO> categories = categoryService.getAllCategories();
        CategoryDTO foodCategory = categories.stream()
                .filter(c -> c.getName().equals("Food & Dining"))
                .findFirst()
                .orElseThrow();

        // 3. Create an EXPENSE transaction of $150.00
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .description("Grocery Shopping")
                .amount(new BigDecimal("150.00"))
                .date(LocalDateTime.now())
                .type(TransactionType.EXPENSE)
                .categoryId(foodCategory.getId())
                .fromAccountId(createdAccount.getId())
                .build();

        TransactionDTO createdTransaction = transactionService.createTransaction(transactionDTO);
        assertNotNull(createdTransaction.getId());

        // 4. Verify Account balance has been updated (1000.00 - 150.00 = 850.00)
        AccountDTO updatedAccount = accountService.getAccountById(createdAccount.getId());
        assertEquals(0, new BigDecimal("850.00").compareTo(updatedAccount.getBalance()));
    }

    @Test
    void testCreateIncomeTransactionUpdatesAccountBalance() {
        // 1. Create a cash account with initial balance $50.00
        AccountDTO accountDTO = AccountDTO.builder()
                .name("Wallet Cash")
                .type(AccountType.CASH)
                .balance(new BigDecimal("50.00"))
                .currency("USD")
                .build();
        AccountDTO createdAccount = accountService.createAccount(accountDTO);

        // 2. Fetch an income category (e.g., Salary)
        List<CategoryDTO> categories = categoryService.getAllCategories();
        CategoryDTO salaryCategory = categories.stream()
                .filter(c -> c.getName().equals("Salary"))
                .findFirst()
                .orElseThrow();

        // 3. Create an INCOME transaction of $500.00
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .description("Salary Paycheck")
                .amount(new BigDecimal("500.00"))
                .date(LocalDateTime.now())
                .type(TransactionType.INCOME)
                .categoryId(salaryCategory.getId())
                .toAccountId(createdAccount.getId())
                .build();

        transactionService.createTransaction(transactionDTO);

        // 4. Verify Account balance has been updated (50.00 + 500.00 = 550.00)
        AccountDTO updatedAccount = accountService.getAccountById(createdAccount.getId());
        assertEquals(0, new BigDecimal("550.00").compareTo(updatedAccount.getBalance()));
    }

    @Test
    void testTransferTransactionUpdatesBothAccountBalances() {
        // 1. Create source bank account with initial balance $1000.00
        AccountDTO bankDTO = AccountDTO.builder()
                .name("Checking Account")
                .type(AccountType.BANK)
                .balance(new BigDecimal("1000.00"))
                .currency("USD")
                .build();
        AccountDTO sourceAccount = accountService.createAccount(bankDTO);

        // 2. Create destination cash account with initial balance $50.00
        AccountDTO cashDTO = AccountDTO.builder()
                .name("Wallet Cash")
                .type(AccountType.CASH)
                .balance(new BigDecimal("50.00"))
                .currency("USD")
                .build();
        AccountDTO destAccount = accountService.createAccount(cashDTO);

        // 3. Fetch any default category (e.g. Salary, Category id is required by schema)
        CategoryDTO category = categoryService.getAllCategories().get(0);

        // 4. Create a TRANSFER transaction of $100.00
        TransactionDTO transactionDTO = TransactionDTO.builder()
                .description("Atm Withdrawal")
                .amount(new BigDecimal("100.00"))
                .date(LocalDateTime.now())
                .type(TransactionType.TRANSFER)
                .categoryId(category.getId())
                .fromAccountId(sourceAccount.getId())
                .toAccountId(destAccount.getId())
                .build();

        transactionService.createTransaction(transactionDTO);

        // 5. Verify balances:
        // Source Account: 1000.00 - 100.00 = 900.00
        // Dest Account: 50.00 + 100.00 = 150.00
        AccountDTO updatedSource = accountService.getAccountById(sourceAccount.getId());
        AccountDTO updatedDest = accountService.getAccountById(destAccount.getId());

        assertEquals(0, new BigDecimal("900.00").compareTo(updatedSource.getBalance()));
        assertEquals(0, new BigDecimal("150.00").compareTo(updatedDest.getBalance()));
    }
}
