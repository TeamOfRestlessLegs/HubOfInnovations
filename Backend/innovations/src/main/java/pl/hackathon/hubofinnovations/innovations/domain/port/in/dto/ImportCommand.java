package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

import java.util.List;

public record ImportCommand(
        List<UpsertCategoryCommand> categories,
        List<ImportInnovation> innovations) {
    public record ImportInnovation(UpsertInnovationCommand innovation, List<FileCommand> files) {}
}
