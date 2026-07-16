package com.personalfinance.manager.service;

import com.personalfinance.manager.dto.CategoryDTO;
import com.personalfinance.manager.model.Category;

import java.util.List;

public interface CategoryService {
    List<CategoryDTO> getAllCategories();
    CategoryDTO getCategoryById(Long id);
    CategoryDTO createCategory(CategoryDTO categoryDTO);
    CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO);
    void deleteCategory(Long id);
    Category getCategoryEntity(Long id);
    void seedDefaultCategories(); // To initialize system categories
}
