package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

public record ImportResultDto(int categoriesUpserted, int innovationsCreated,
                              int innovationsUpdated, int innovationsUnchanged, int filesWritten) {}
