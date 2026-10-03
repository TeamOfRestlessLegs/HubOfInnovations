package pl.hackathon.hubofinnovations.innovations.domain.port.in;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.*;

import java.util.List;

public interface InnovationUseCase {
    List<CategoryDto> getAllCategories();
    CategoryDto getCategory(String categorySlug);
    CategoryDto createCategory(UpsertCategoryCommand command);
    CategoryDto updateCategory(String categorySlug, UpsertCategoryCommand command);
    void deleteCategory(String categorySlug);

    Page<InnovationSummaryDto> getInnovations(String categorySlug, Pageable pageable);
    InnovationDetailsDto getInnovation(String categorySlug, String slug);
    List<InnovationSummaryDto> getInnovationsByIds(List<String> ids);

    InnovationDetailsDto createInnovation(UpsertInnovationCommand command);
    InnovationDetailsDto updateInnovation(String categorySlug, String slug, UpsertInnovationCommand command);
    void deleteInnovation(String categorySlug, String slug);

    List<InnovationFileDto> getFiles(String categorySlug, String slug, String kind, Boolean pdfReadable);
    List<InnovationFileDto> replaceFiles(String categorySlug, String slug, List<FileCommand> files);
    void deleteFile(String categorySlug, String slug, long fileId);

    ImportResultDto importData(ImportCommand command);
}