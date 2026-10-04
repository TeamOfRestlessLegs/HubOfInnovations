package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

import java.time.LocalDateTime;

public record QuestionDto(Long id, Long ideaId, Long authorId, String type, String addressee, String body, Boolean applied, LocalDateTime createdAt) {}
