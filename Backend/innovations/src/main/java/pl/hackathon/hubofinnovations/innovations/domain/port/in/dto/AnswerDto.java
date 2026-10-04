package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

import java.time.LocalDateTime;

public record AnswerDto(Long id, Long questionId, Long authorId, String body, LocalDateTime createdAt) {}