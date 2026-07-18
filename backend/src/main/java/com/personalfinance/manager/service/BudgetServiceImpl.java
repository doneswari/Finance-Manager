package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.BudgetDTO;
import com.personalfinance.manager.exception.ResourceNotFoundException;
import com.personalfinance.manager.model.Budget;
import com.personalfinance.manager.model.Category;
import com.personalfinance.manager.model.User;
import com.personalfinance.manager.repository.BudgetRepository;
import com.personalfinance.manager.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryService categoryService;
    private final UserService userService;

    public BudgetServiceImpl(
            BudgetRepository budgetRepository,
            TransactionRepository transactionRepository,
            CategoryService categoryService,
            UserService userService) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.categoryService = categoryService;
        this.userService = userService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BudgetDTO> getAllBudgets() {
        User currentUser = userService.getCurrentUser();
        return budgetRepository.findByUserId(currentUser.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetDTO getBudgetById(Long id) {
        User currentUser = userService.getCurrentUser();
        Budget budget = budgetRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));
        return convertToDTO(budget);
    }

    @Override
    @Transactional
    public BudgetDTO createBudget(BudgetDTO dto) {
        User currentUser = userService.getCurrentUser();
        Category category = categoryService.getCategoryEntity(dto.getCategoryId());

        // Calculate dynamic current spent amount from startDate onwards
        BigDecimal currentSpent = transactionRepository.sumExpensesByCategoryFromDate(
                currentUser.getId(), 
                category.getId(), 
                dto.getStartDate().atStartOfDay()
        );

        Budget budget = Budget.builder()
                .limitAmount(dto.getLimitAmount())
                .currentAmount(currentSpent)
                .startDate(dto.getStartDate())
                .category(category)
                .user(currentUser)
                .build();

        return convertToDTO(budgetRepository.save(budget));
    }

    @Override
    @Transactional
    public BudgetDTO updateBudget(Long id, BudgetDTO dto) {
        User currentUser = userService.getCurrentUser();
        Budget budget = budgetRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));

        Category category = categoryService.getCategoryEntity(dto.getCategoryId());

        // Calculate dynamic current spent amount from startDate onwards
        BigDecimal currentSpent = transactionRepository.sumExpensesByCategoryFromDate(
                currentUser.getId(), 
                category.getId(), 
                dto.getStartDate().atStartOfDay()
        );

        budget.setLimitAmount(dto.getLimitAmount());
        budget.setCurrentAmount(currentSpent);
        budget.setStartDate(dto.getStartDate());
        budget.setCategory(category);

        return convertToDTO(budgetRepository.save(budget));
    }

    @Override
    @Transactional
    public void deleteBudget(Long id) {
        User currentUser = userService.getCurrentUser();
        Budget budget = budgetRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));
        budgetRepository.delete(budget);
    }

    @Override
    @Transactional
    public void updateBudgetOnExpense(BigDecimal amount, Long categoryId, LocalDate date) {
        User currentUser = userService.getCurrentUser();
        List<Budget> activeBudgets = budgetRepository.findActiveBudgetsOrderByStartDateDesc(currentUser.getId(), categoryId, date);
        if (!activeBudgets.isEmpty()) {
            Budget budget = activeBudgets.get(0);
            budget.setCurrentAmount(budget.getCurrentAmount().add(amount));
            budgetRepository.save(budget);
        }
    }

    private BudgetDTO convertToDTO(Budget b) {
        boolean isExceeded = b.getCurrentAmount().compareTo(b.getLimitAmount()) > 0;
        return BudgetDTO.builder()
                .id(b.getId())
                .limitAmount(b.getLimitAmount())
                .currentAmount(b.getCurrentAmount())
                .startDate(b.getStartDate())
                .categoryId(b.getCategory().getId())
                .categoryName(b.getCategory().getName())
                .isExceeded(isExceeded)
                .build();
    }
}
