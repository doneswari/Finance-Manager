package com.personalfinance.manager.config;

import com.personalfinance.manager.model.*;
import com.personalfinance.manager.repository.*;
import com.personalfinance.manager.service.CategoryService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final CategoryService categoryService;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DatabaseSeeder(CategoryService categoryService,
                          UserRepository userRepository,
                          AccountRepository accountRepository,
                          CategoryRepository categoryRepository,
                          TransactionRepository transactionRepository,
                          BudgetRepository budgetRepository,
                          PasswordEncoder passwordEncoder,
                          JdbcTemplate jdbcTemplate) {
        this.categoryService = categoryService;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Run database migration to ensure accounts type column accepts WALLET
        try {
            jdbcTemplate.execute("ALTER TABLE accounts MODIFY COLUMN type VARCHAR(50) NOT NULL");
            System.out.println("Database Migration: Altered accounts type column successfully.");
        } catch (Exception e) {
            System.out.println("Database Migration: Skipping table alter or already varchar: " + e.getMessage());
        }

        // Run database migration to drop end_date from budgets table
        try {
            jdbcTemplate.execute("ALTER TABLE budgets DROP COLUMN end_date");
            System.out.println("Database Migration: Dropped end_date column from budgets successfully.");
        } catch (Exception e) {
            System.out.println("Database Migration: Skipping budgets end_date drop or already dropped: " + e.getMessage());
        }

        // 1. Seed categories
        categoryService.seedDefaultCategories();

        // 2. Load or reset demo user
        User tempUser;
        var existingUserOpt = userRepository.findByUsername("demo");
        if (existingUserOpt.isPresent()) {
            System.out.println("Demo user exists. Cleaning old data and re-seeding...");
            tempUser = existingUserOpt.get();
            
            final Long demoUserId = tempUser.getId();

            // Delete old data to avoid duplicates and integrity constraint checks on re-run
            List<Transaction> userTransactions = transactionRepository.findAll().stream()
                    .filter(t -> t.getUser().getId().equals(demoUserId)).toList();
            transactionRepository.deleteAll(userTransactions);

            List<Budget> userBudgets = budgetRepository.findAll().stream()
                    .filter(b -> b.getUser().getId().equals(demoUserId)).toList();
            budgetRepository.deleteAll(userBudgets);

            List<Account> userAccounts = accountRepository.findAll().stream()
                    .filter(a -> a.getUser().getId().equals(demoUserId)).toList();
            accountRepository.deleteAll(userAccounts);

            // Force update password to BCrypt hash of "password123"
            tempUser.setPassword(passwordEncoder.encode("password123"));
            tempUser = userRepository.save(tempUser);
        } else {
            System.out.println("Creating new demo user...");
            User newUser = new User();
            newUser.setUsername("demo");
            newUser.setEmail("demo@example.com");
            newUser.setPassword(passwordEncoder.encode("password123"));
            newUser.setRole("USER");
            tempUser = userRepository.save(newUser);
        }

        final User demoUser = tempUser;

        // Fetch seeded default categories
        List<Category> categories = categoryRepository.findAll();
        Category salaryCat = categories.stream().filter(c -> c.getName().equals("Salary")).findFirst().orElse(null);
        Category foodCat = categories.stream().filter(c -> c.getName().equals("Food & Dining")).findFirst().orElse(null);
        Category rentCat = categories.stream().filter(c -> c.getName().equals("Rent & Housing")).findFirst().orElse(null);
        Category utilitiesCat = categories.stream().filter(c -> c.getName().equals("Utilities")).findFirst().orElse(null);
        Category entertainmentCat = categories.stream().filter(c -> c.getName().equals("Entertainment")).findFirst().orElse(null);

        // 3. Create default accounts for demo user (with calculated post-transaction balances)
        Account checking = new Account();
        checking.setName("Checking Account");
        checking.setType(AccountType.BANK);
        checking.setBalance(BigDecimal.valueOf(246200.00)); // ₹50000.00 initial + ₹280000.00 incomes - ₹73800.00 expenses - ₹10000.00 transfer
        checking.setCurrency("INR");
        checking.setUser(demoUser);
        checking = accountRepository.save(checking);

        Account wallet = new Account();
        wallet.setName("Cash Wallet");
        wallet.setType(AccountType.CASH);
        wallet.setBalance(BigDecimal.valueOf(15000.00)); // ₹5000.00 initial + ₹10000.00 transfer in
        wallet.setCurrency("INR");
        wallet.setUser(demoUser);
        wallet = accountRepository.save(wallet);

        Account investment = new Account();
        investment.setName("Investment Portfolio");
        investment.setType(AccountType.INVESTMENT);
        investment.setBalance(BigDecimal.valueOf(1000000.00));
        investment.setCurrency("INR");
        investment.setUser(demoUser);
        investment = accountRepository.save(investment);

        // 4. Seed Budgets for current month
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());

        if (foodCat != null) {
            Budget foodBudget = new Budget();
            foodBudget.setCategory(foodCat);
            foodBudget.setLimitAmount(BigDecimal.valueOf(30000.00));
            foodBudget.setCurrentAmount(BigDecimal.valueOf(15000.00));
            foodBudget.setStartDate(startOfMonth);
            foodBudget.setUser(demoUser);
            budgetRepository.save(foodBudget);
        }

        if (rentCat != null) {
            Budget rentBudget = new Budget();
            rentBudget.setCategory(rentCat);
            rentBudget.setLimitAmount(BigDecimal.valueOf(50000.00));
            rentBudget.setCurrentAmount(BigDecimal.valueOf(50000.00));
            rentBudget.setStartDate(startOfMonth);
            rentBudget.setUser(demoUser);
            budgetRepository.save(rentBudget);
        }

        // 5. Seed Transactions (Current month timeline scattering for charts visualization)
        LocalDateTime baseTime = LocalDateTime.now();

        // Income: Monthly Salary (₹250000.00)
        Transaction salaryTrans = new Transaction();
        salaryTrans.setDescription("Monthly Salary");
        salaryTrans.setAmount(BigDecimal.valueOf(250000.00));
        salaryTrans.setDate(baseTime.minusDays(5));
        salaryTrans.setType(TransactionType.INCOME);
        salaryTrans.setCategory(salaryCat);
        salaryTrans.setToAccount(checking);
        salaryTrans.setUser(demoUser);
        transactionRepository.save(salaryTrans);

        // Income: Freelance Work (₹30000.00)
        Transaction freelanceTrans = new Transaction();
        freelanceTrans.setDescription("Freelance Design");
        freelanceTrans.setAmount(BigDecimal.valueOf(30000.00));
        freelanceTrans.setDate(baseTime.minusDays(2));
        freelanceTrans.setType(TransactionType.INCOME);
        freelanceTrans.setCategory(salaryCat);
        freelanceTrans.setToAccount(checking);
        freelanceTrans.setUser(demoUser);
        transactionRepository.save(freelanceTrans);

        // Expense: Rent (₹50000.00)
        Transaction rentTrans = new Transaction();
        rentTrans.setDescription("Apartment Rent");
        rentTrans.setAmount(BigDecimal.valueOf(50000.00));
        rentTrans.setDate(baseTime.minusDays(4));
        rentTrans.setType(TransactionType.EXPENSE);
        rentTrans.setCategory(rentCat);
        rentTrans.setFromAccount(checking);
        rentTrans.setUser(demoUser);
        transactionRepository.save(rentTrans);

        // Expense: Grocery (₹15000.00)
        Transaction groceryTrans = new Transaction();
        groceryTrans.setDescription("Whole Foods Groceries");
        groceryTrans.setAmount(BigDecimal.valueOf(15000.00));
        groceryTrans.setDate(baseTime.minusDays(3));
        groceryTrans.setType(TransactionType.EXPENSE);
        groceryTrans.setCategory(foodCat);
        groceryTrans.setFromAccount(checking);
        groceryTrans.setUser(demoUser);
        transactionRepository.save(groceryTrans);

        // Expense: Electric Bill (₹8000.00)
        Transaction powerTrans = new Transaction();
        powerTrans.setDescription("Power Electric Bill");
        powerTrans.setAmount(BigDecimal.valueOf(8000.00));
        powerTrans.setDate(baseTime.minusDays(1));
        powerTrans.setType(TransactionType.EXPENSE);
        powerTrans.setCategory(utilitiesCat);
        powerTrans.setFromAccount(checking);
        powerTrans.setUser(demoUser);
        transactionRepository.save(powerTrans);

        // Expense: Netflix (₹800.00)
        Transaction netflixTrans = new Transaction();
        netflixTrans.setDescription("Netflix Streaming");
        netflixTrans.setAmount(BigDecimal.valueOf(800.00));
        netflixTrans.setDate(baseTime.minusHours(4));
        netflixTrans.setType(TransactionType.EXPENSE);
        netflixTrans.setCategory(entertainmentCat);
        netflixTrans.setFromAccount(checking);
        netflixTrans.setUser(demoUser);
        transactionRepository.save(netflixTrans);

        // Transfer: ATM Withdrawal (₹10000.00)
        Transaction atmTrans = new Transaction();
        atmTrans.setDescription("ATM Cash Withdrawal");
        atmTrans.setAmount(BigDecimal.valueOf(10000.00));
        atmTrans.setDate(baseTime.minusHours(12));
        atmTrans.setType(TransactionType.TRANSFER);
        atmTrans.setCategory(utilitiesCat);
        atmTrans.setFromAccount(checking);
        atmTrans.setToAccount(wallet);
        atmTrans.setUser(demoUser);
        transactionRepository.save(atmTrans);

        System.out.println("Demo seeding and data cleanup completed successfully!");
    }
}
