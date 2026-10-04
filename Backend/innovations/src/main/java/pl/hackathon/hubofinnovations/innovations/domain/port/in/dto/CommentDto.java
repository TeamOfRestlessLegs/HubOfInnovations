package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

import java.time.LocalDateTime;

public record CommentDto(Long id, Long ideaId, Long authorId, String section, String body, LocalDateTime createdAt) {}