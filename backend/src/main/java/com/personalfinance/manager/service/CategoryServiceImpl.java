package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.CategoryDTO;
import com.personalfinance.manager.exception.BadRequestException;
import com.personalfinance.manager.exception.ResourceNotFoundException;
import com.personalfinance.manager.model.Category;
import com.personalfinance.manager.model.TransactionType;
import com.personalfinance.manager.model.User;
import com.personalfinance.manager.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserService userService;

    public CategoryServiceImpl(CategoryRepository categoryRepository, UserService userService) {
        this.categoryRepository = categoryRepository;
        this.userService = userService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        User currentUser = userService.getCurrentUser();
        return categoryRepository.findAllDefaultAndCustomByUserId(currentUser.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category category = getCategoryEntity(id);
        return convertToDTO(category);
    }

    @Override
    @Transactional
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        User currentUser = userService.getCurrentUser();
        Category category = Category.builder()
                .name(categoryDTO.getName())
                .type(categoryDTO.getType())
                .isDefault(false)
                .user(currentUser)
                .build();
        
        return convertToDTO(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO) {
        Category category = getCategoryEntity(id);
        if (category.getIsDefault()) {
            throw new BadRequestException("System default categories cannot be modified");
        }
        category.setName(categoryDTO.getName());
        category.setType(categoryDTO.getType());
        
        return convertToDTO(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = getCategoryEntity(id);
        if (category.getIsDefault()) {
            throw new BadRequestException("System default categories cannot be deleted");
        }
        categoryRepository.delete(category);
    }

    @Override
    @Transactional(readOnly = true)
    public Category getCategoryEntity(Long id) {
        User currentUser = userService.getCurrentUser();
        return categoryRepository.findByIdAndIsDefaultOrUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    @Override
    @Transactional
    public void seedDefaultCategories() {
        List<Category> defaultCategories = categoryRepository.findByIsDefaultTrue();
        if (defaultCategories.isEmpty()) {
            List<Category> seeds = Arrays.asList(
                Category.builder().name("Salary").type(TransactionType.INCOME).isDefault(true).build(),
                Category.builder().name("Freelance").type(TransactionType.INCOME).isDefault(true).build(),
                Category.builder().name("Investments").type(TransactionType.INCOME).isDefault(true).build(),
                Category.builder().name("Gifts").type(TransactionType.INCOME).isDefault(true).build(),
                
                Category.builder().name("Food & Dining").type(TransactionType.EXPENSE).isDefault(true).build(),
                Category.builder().name("Rent & Housing").type(TransactionType.EXPENSE).isDefault(true).build(),
                Category.builder().name("Utilities").type(TransactionType.EXPENSE).isDefault(true).build(),
                Category.builder().name("Transportation").type(TransactionType.EXPENSE).isDefault(true).build(),
                Category.builder().name("Shopping").type(TransactionType.EXPENSE).isDefault(true).build(),
                Category.builder().name("Entertainment").type(TransactionType.EXPENSE).isDefault(true).build(),
                Category.builder().name("Healthcare").type(TransactionType.EXPENSE).isDefault(true).build()
            );
            categoryRepository.saveAll(seeds);
        }
    }

    private CategoryDTO convertToDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .isDefault(category.getIsDefault())
                .build();
    }
}
