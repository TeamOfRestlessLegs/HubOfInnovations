package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

public record InnovationSummaryDto(
        String id, String categorySlug, String slug, String title,
        String shortDescription, String sourceUrl, String materialsUrl, String videoUrl) {}
