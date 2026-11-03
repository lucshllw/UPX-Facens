package com.reuseplus.service;

import com.reuseplus.domain.Category;
import com.reuseplus.dto.CategoryRequest;
import com.reuseplus.dto.CategoryResponse;
import com.reuseplus.exception.ApiException;
import com.reuseplus.repository.CategoryRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> list() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsBySlug(normalizeSlug(request.slug()))) {
            throw new ApiException(HttpStatus.CONFLICT, "Categoria ja existe.");
        }
        Category category = new Category(request.name().trim(), normalizeSlug(request.slug()), request.description());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = findById(id);
        category.update(request.name().trim(), normalizeSlug(request.slug()), request.description());
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long id) {
        categoryRepository.delete(findById(id));
    }

    public Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Categoria nao encontrada."));
    }

    private static String normalizeSlug(String slug) {
        return slug.trim().toLowerCase();
    }
}
