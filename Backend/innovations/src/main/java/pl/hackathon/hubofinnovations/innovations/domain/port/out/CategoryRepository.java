package pl.hackathon.hubofinnovations.innovations.domain.port.out;

import pl.hackathon.hubofinnovations.innovations.domain.model.Category;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository {
    List<Category> findAll();
    Optional<Category> findBySlug(String slug);
    Category save(Category category);
    void delete(String slug);
    long countInnovationsByCategory(String slug);
}