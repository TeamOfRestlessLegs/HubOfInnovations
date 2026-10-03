package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import pl.hackathon.hubofinnovations.innovations.domain.model.Category;
import pl.hackathon.hubofinnovations.innovations.domain.model.Innovation;
import pl.hackathon.hubofinnovations.innovations.domain.model.InnovationFile;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.InnovationRepository;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class InnovationRepositoryAdapter implements InnovationRepository {

    private final SpringDataInnovationRepository repository;
    private final SpringDataCategoryRepository categoryRepository;

    @Override
    public List<Innovation> findAll() {
        return repository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public List<Innovation> findByCategorySlug(String categorySlug) {
        return repository.findByCategorySlug(categorySlug).stream().map(this::toDomain).toList();
    }

    @Override
    public Page<Innovation> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toDomain);
    }

    @Override
    public Page<Innovation> findByCategorySlug(String categorySlug, Pageable pageable) {
        return repository.findByCategorySlug(categorySlug, pageable).map(this::toDomain);
    }

    @Override
    public List<Innovation> findAllByIds(List<String> ids) {
        return repository.findAllById(ids).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<Innovation> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public Innovation save(Innovation innovation) {
        CategoryEntity categoryEntity = categoryRepository.findById(innovation.category().slug())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        InnovationEntity entity = InnovationEntity.builder()
                .id(innovation.id())
                .category(categoryEntity)
                .slug(innovation.slug())
                .title(innovation.title())
                .shortDescription(innovation.shortDescription())
                .descriptionMd(innovation.descriptionMd())
                .sourceUrl(innovation.sourceUrl())
                .materialsUrl(innovation.materialsUrl())
                .videoUrl(innovation.videoUrl())
                .scrapedAt(innovation.scrapedAt())
                .contentHash(innovation.contentHash())
                .build();

        if (innovation.files() != null) {
            List<InnovationFileEntity> fileEntities = innovation.files().stream().map(f ->
                    InnovationFileEntity.builder()
                            .id(f.id()).innovation(entity).kind(f.kind()).fileName(f.fileName())
                            .sourceUrl(f.sourceUrl()).pathInZip(f.pathInZip()).storagePath(f.storagePath())
                            .sizeBytes(f.sizeBytes()).pdfReadable(f.pdfReadable()).pdfPages(f.pdfPages())
                            .build()
            ).toList();
            entity.getFiles().addAll(fileEntities);
        }
        return toDomain(repository.save(entity));
    }

    @Override
    public void delete(String id) {
        repository.deleteById(id);
    }

    private Innovation toDomain(InnovationEntity entity) {
        Category category = new Category(
                entity.getCategory().getSlug(),
                entity.getCategory().getName(),
                entity.getCategory().getSourceUrl()
        );

        List<InnovationFile> files = entity.getFiles().stream().map(f ->
                new InnovationFile(
                        f.getId(), f.getKind(), f.getFileName(), f.getSourceUrl(),
                        f.getPathInZip(), f.getStoragePath(), f.getSizeBytes(),
                        f.getPdfReadable(), f.getPdfPages()
                )
        ).toList();

        return new Innovation(
                entity.getId(), category, entity.getSlug(), entity.getTitle(),
                entity.getShortDescription(), entity.getDescriptionMd(), entity.getSourceUrl(),
                entity.getMaterialsUrl(), entity.getVideoUrl(), entity.getScrapedAt(),
                entity.getContentHash(), files
        );
    }
}