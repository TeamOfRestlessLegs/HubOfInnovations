package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

public record UpsertCategoryCommand(String slug, String name, String sourceUrl) {}
