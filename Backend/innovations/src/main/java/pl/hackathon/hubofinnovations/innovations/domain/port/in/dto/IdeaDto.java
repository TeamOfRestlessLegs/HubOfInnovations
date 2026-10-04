package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;
import java.time.LocalDateTime;

public record IdeaDto(
        Long id,
        Long authorId,
        Long ledById,
        Boolean byMunicipality,
        String problem,
        String customGroup,
        String title,
        String summary,
        Integer stage,
        String novelty,
        IdeaStatus status,
        String rejectReason,
        Long endorsedById,
        LocalDateTime endorsedAt,
        Boolean stageRequested,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}