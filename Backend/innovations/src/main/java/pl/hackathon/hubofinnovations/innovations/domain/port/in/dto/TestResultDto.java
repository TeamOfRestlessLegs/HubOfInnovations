package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

import java.time.LocalDateTime;

public record TestResultDto(String innovationId, String status, String message, LocalDateTime executedAt) {}