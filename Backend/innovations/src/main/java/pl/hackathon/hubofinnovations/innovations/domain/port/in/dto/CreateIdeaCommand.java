package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

public record CreateIdeaCommand(
        Long authorId,
        Boolean byMunicipality,
        String title,
        String problem,
        String customGroup,
        String summary,
        String novelty
) {}