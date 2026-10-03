package pl.hackathon.hubofinnovations.innovations.domain.port.in.dto;

public record FileCommand(
        String kind, String fileName, String sourceUrl, String pathInZip,
        String storagePath, Long sizeBytes, Boolean pdfReadable, Integer pdfPages) {}
