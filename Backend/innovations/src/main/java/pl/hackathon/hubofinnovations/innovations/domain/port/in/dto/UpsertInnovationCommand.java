package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

import java.time.OffsetDateTime;

public record UpsertInnovationCommand(
        String categorySlug, String slug, String title, String shortDescription,
        String descriptionMd, String sourceUrl, String materialsUrl, String videoUrl,
        OffsetDateTime scrapedAt, String contentHash) {}
