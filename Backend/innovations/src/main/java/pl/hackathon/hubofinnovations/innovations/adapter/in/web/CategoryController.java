package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CategoryDto;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.UpsertCategoryCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.InnovationUseCase;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final InnovationUseCase innovationUseCase;

    @GetMapping
    public List<CategoryDto> getAllCategories() {
        return innovationUseCase.getAllCategories();
    }

    @GetMapping("/{categorySlug}")
    public CategoryDto getCategory(@PathVariable String categorySlug) {
        return innovationUseCase.getCategory(categorySlug);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto createCategory(@RequestBody UpsertCategoryCommand command) {
        return innovationUseCase.createCategory(command);
    }

    @PutMapping("/{categorySlug}")
    public CategoryDto updateCategory(@PathVariable String categorySlug, @RequestBody UpsertCategoryCommand command) {
        return innovationUseCase.updateCategory(categorySlug, command);
    }

    @DeleteMapping("/{categorySlug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable String categorySlug) {
        innovationUseCase.deleteCategory(categorySlug);
    }
}