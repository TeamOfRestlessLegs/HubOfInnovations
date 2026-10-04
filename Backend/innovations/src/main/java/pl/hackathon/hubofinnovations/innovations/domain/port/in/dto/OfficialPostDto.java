package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

import java.time.LocalDateTime;

public record OfficialPostDto(Long id, Long ideaId, Long authorId, String kind, String event, String body, LocalDateTime createdAt) {}
