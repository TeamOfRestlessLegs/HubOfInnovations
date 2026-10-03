package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pl.hackathon.hubofinnovations.innovations.domain.model.Category;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.CategoryRepository;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CategoryRepositoryAdapter implements CategoryRepository {
    private final SpringDataCategoryRepository repository;
    private final SpringDataInnovationRepository innovationRepository;

    @Override
    public List<Category> findAll() {
        return repository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Category> findBySlug(String slug) {
        return repository.findById(slug).map(this::toDomain);
    }

    @Override
    public Category save(Category category) {
        CategoryEntity entity = CategoryEntity.builder()
                .slug(category.slug()).name(category.name()).sourceUrl(category.sourceUrl())
                .build();
        return toDomain(repository.save(entity));
    }

    @Override
    public void delete(String slug) {
        repository.deleteById(slug);
    }

    @Override
    public long countInnovationsByCategory(String slug) {
        return innovationRepository.countByCategorySlug(slug);
    }

    private Category toDomain(CategoryEntity entity) {
        return new Category(entity.getSlug(), entity.getName(), entity.getSourceUrl());
    }
}