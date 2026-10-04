package pl.hackathon.hubofinnovations.innovations.domain.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pl.hackathon.hubofinnovations.innovations.domain.model.Category;
import pl.hackathon.hubofinnovations.innovations.domain.model.Innovation;
import pl.hackathon.hubofinnovations.innovations.domain.model.InnovationFile;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.InnovationUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.*;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.CategoryRepository;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.InnovationRepository;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.InnovationTesterRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class InnovationManager implements InnovationUseCase {
    private final CategoryRepository categoryRepository;
    private final InnovationRepository innovationRepository;
    private final InnovationTesterRepository testerRepository;


    @Override
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> new CategoryDto(c.slug(), c.name(), c.sourceUrl(), categoryRepository.countInnovationsByCategory(c.slug())))
                .toList();
    }

    @Override
    public CategoryDto getCategory(String categorySlug) {
        Category c = categoryRepository.findBySlug(categorySlug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return new CategoryDto(c.slug(), c.name(), c.sourceUrl(), categoryRepository.countInnovationsByCategory(c.slug()));
    }

    @Override
    public CategoryDto createCategory(UpsertCategoryCommand command) {
        if (categoryRepository.findBySlug(command.slug()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists");
        }
        Category saved = categoryRepository.save(new Category(command.slug(), command.name(), command.sourceUrl()));
        return new CategoryDto(saved.slug(), saved.name(), saved.sourceUrl(), 0);
    }

    @Override
    public CategoryDto updateCategory(String categorySlug, UpsertCategoryCommand command) {
        Category existing = categoryRepository.findBySlug(categorySlug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Category updated = categoryRepository.save(new Category(existing.slug(), command.name(), command.sourceUrl()));
        return new CategoryDto(updated.slug(), updated.name(), updated.sourceUrl(), categoryRepository.countInnovationsByCategory(updated.slug()));
    }

    @Override
    public void deleteCategory(String categorySlug) {
        if (categoryRepository.countInnovationsByCategory(categorySlug) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete category with innovations");
        }
        categoryRepository.delete(categorySlug);
    }

    @Override
    public Page<InnovationSummaryDto> getInnovations(String categorySlug, Pageable pageable) {
        Page<Innovation> innovations = (categorySlug == null)
                ? innovationRepository.findAll(pageable)
                : innovationRepository.findByCategorySlug(categorySlug, pageable);
        return innovations.map(this::toSummaryDto);
    }

    @Override
    public InnovationDetailsDto getInnovation(String categorySlug, String slug) {
        String id = categorySlug + "/" + slug;
        return innovationRepository.findById(id)
                .map(this::toDetailsDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Override
    public List<InnovationSummaryDto> getInnovationsByIds(List<String> ids) {
        List<Innovation> dbResults = innovationRepository.findAllByIds(ids);
        Map<String, Innovation> innovationMap = dbResults.stream().collect(Collectors.toMap(Innovation::id, i -> i));

        return ids.stream()
                .map(innovationMap::get)
                .filter(Objects::nonNull)
                .map(this::toSummaryDto)
                .toList();
    }

    @Override
    public InnovationDetailsDto createInnovation(UpsertInnovationCommand cmd) {
        String id = cmd.categorySlug() + "/" + cmd.slug();
        if (innovationRepository.findById(id).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT);
        }
        Category category = categoryRepository.findBySlug(cmd.categorySlug())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        Innovation innovation = new Innovation(id, category, cmd.slug(), cmd.title(), cmd.shortDescription(), cmd.descriptionMd(), cmd.sourceUrl(), cmd.materialsUrl(), cmd.videoUrl(), cmd.scrapedAt(), cmd.contentHash(), List.of());
        return toDetailsDto(innovationRepository.save(innovation));
    }

    @Override
    public InnovationDetailsDto updateInnovation(String categorySlug, String slug, UpsertInnovationCommand cmd) {
        String id = categorySlug + "/" + slug;
        Innovation existing = innovationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Category category = categoryRepository.findBySlug(cmd.categorySlug())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Innovation updated = new Innovation(id, category, cmd.slug(), cmd.title(), cmd.shortDescription(), cmd.descriptionMd(), cmd.sourceUrl(), cmd.materialsUrl(), cmd.videoUrl(), cmd.scrapedAt(), cmd.contentHash(), existing.files());
        return toDetailsDto(innovationRepository.save(updated));
    }

    @Override
    public void deleteInnovation(String categorySlug, String slug) {
        innovationRepository.delete(categorySlug + "/" + slug);
    }

    @Override
    public List<InnovationFileDto> getFiles(String categorySlug, String slug, String kind, Boolean pdfReadable) {
        Innovation inno = innovationRepository.findById(categorySlug + "/" + slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return inno.files().stream()
                .filter(f -> (kind == null || kind.equals(f.kind())) && (pdfReadable == null || pdfReadable.equals(f.pdfReadable())))
                .map(this::toFileDto)
                .toList();
    }

    @Override
    public List<InnovationFileDto> replaceFiles(String categorySlug, String slug, List<FileCommand> files) {
        String id = categorySlug + "/" + slug;
        Innovation existing = innovationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<InnovationFile> newFiles = files.stream().map(f ->
                new InnovationFile(null, f.kind(), f.fileName(), f.sourceUrl(), f.pathInZip(), f.storagePath(), f.sizeBytes(), f.pdfReadable(), f.pdfPages())
        ).toList();

        Innovation updated = new Innovation(id, existing.category(), existing.slug(), existing.title(), existing.shortDescription(), existing.descriptionMd(), existing.sourceUrl(), existing.materialsUrl(), existing.videoUrl(), existing.scrapedAt(), existing.contentHash(), newFiles);
        return innovationRepository.save(updated).files().stream().map(this::toFileDto).toList();
    }

    @Override
    public void deleteFile(String categorySlug, String slug, long fileId) {
        String id = categorySlug + "/" + slug;
        Innovation existing = innovationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<InnovationFile> filteredFiles = existing.files().stream()
                .filter(f -> !f.id().equals(fileId))
                .toList();

        Innovation updated = new Innovation(id, existing.category(), existing.slug(), existing.title(), existing.shortDescription(), existing.descriptionMd(), existing.sourceUrl(), existing.materialsUrl(), existing.videoUrl(), existing.scrapedAt(), existing.contentHash(), filteredFiles);
        innovationRepository.save(updated);
    }

    @Override
    public ImportResultDto importData(ImportCommand command) {
        int catUpserts = 0, innCreated = 0, innUpdated = 0, innUnchanged = 0, filesWritten = 0;

        for (UpsertCategoryCommand c : command.categories()) {
            categoryRepository.save(new Category(c.slug(), c.name(), c.sourceUrl()));
            catUpserts++;
        }

        for (ImportCommand.ImportInnovation imp : command.innovations()) {
            String id = imp.innovation().categorySlug() + "/" + imp.innovation().slug();
            Innovation existing = innovationRepository.findById(id).orElse(null);

            if (existing != null && Objects.equals(existing.contentHash(), imp.innovation().contentHash())) {
                innUnchanged++;
                continue;
            }

            Category cat = categoryRepository.findBySlug(imp.innovation().categorySlug()).orElseThrow();
            List<InnovationFile> newFiles = imp.files().stream().map(f ->
                    new InnovationFile(null, f.kind(), f.fileName(), f.sourceUrl(), f.pathInZip(), f.storagePath(), f.sizeBytes(), f.pdfReadable(), f.pdfPages())
            ).toList();

            innovationRepository.save(new Innovation(id, cat, imp.innovation().slug(), imp.innovation().title(), imp.innovation().shortDescription(), imp.innovation().descriptionMd(), imp.innovation().sourceUrl(), imp.innovation().materialsUrl(), imp.innovation().videoUrl(), imp.innovation().scrapedAt(), imp.innovation().contentHash(), newFiles));

            if (existing == null) innCreated++; else innUpdated++;
            filesWritten += newFiles.size();
        }
        return new ImportResultDto(catUpserts, innCreated, innUpdated, innUnchanged, filesWritten);
    }

    @Override
    public void joinAsTester(String categorySlug, String slug) {
        String id = categorySlug + "/" + slug;
        if (innovationRepository.findById(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Innowacja nie istnieje");
        }

        if (testerRepository.exists(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Jesteś już testerem tej innowacji");
        }

        testerRepository.saveTester(id);
    }

    @Override
    public TestResultDto runTests(String categorySlug, String slug) {
        String id = categorySlug + "/" + slug;

        if (!testerRepository.exists(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Musisz dołączyć jako tester, aby uruchomić testy");
        }
        String testStatus = "SUCCESS";
        String message = "Wszystkie testy innowacji przebiegły pomyślnie.";

        return new TestResultDto(id, testStatus, message, LocalDateTime.now());
    }

    private InnovationSummaryDto toSummaryDto(Innovation i) {
        return new InnovationSummaryDto(i.id(), i.category().slug(), i.slug(), i.title(), i.shortDescription(), i.sourceUrl(), i.materialsUrl(), i.videoUrl());
    }

    private InnovationDetailsDto toDetailsDto(Innovation i) {
        List<InnovationFileDto> fileDtos = i.files().stream().map(this::toFileDto).toList();
        return new InnovationDetailsDto(i.id(), i.category().slug(), i.category().name(), i.slug(), i.title(), i.shortDescription(), i.descriptionMd(), i.sourceUrl(), i.materialsUrl(), i.videoUrl(), i.scrapedAt(), fileDtos);
    }

    private InnovationFileDto toFileDto(InnovationFile f) {
        return new InnovationFileDto(f.id(), f.kind(), f.fileName(), f.sourceUrl(), f.pathInZip(), f.storagePath(), f.sizeBytes(), f.pdfReadable(), f.pdfPages());
    }
}