package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

public record InnovationFileDto(
        Long id, String kind, String fileName, String sourceUrl, String pathInZip,
        String storagePath, Long sizeBytes, Boolean pdfReadable, Integer pdfPages) {}
