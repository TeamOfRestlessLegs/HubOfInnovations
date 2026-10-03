package pl.hackathon.hubofinnovations.innovations.domain.model;

import java.time.OffsetDateTime;
import java.util.List;

public record Innovation(
        String id,
        Category category,
        String slug,
        String title,
        String shortDescription,
        String descriptionMd,
        String sourceUrl,
        String materialsUrl,
        String videoUrl,
        OffsetDateTime scrapedAt,
        String contentHash,
        List<InnovationFile> files
) {}