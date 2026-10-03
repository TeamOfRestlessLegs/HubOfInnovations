package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record InnovationDetailsDto(
        String id, String categorySlug, String categoryName, String slug, String title,
        String shortDescription, String descriptionMd, String sourceUrl,
        String materialsUrl, String videoUrl, OffsetDateTime scrapedAt,
        List<InnovationFileDto> files) {}
