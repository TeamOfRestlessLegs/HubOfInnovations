package pl.hackathon.hubofinnovations.innovations.domain.model;

public record InnovationFile(
        Long id,
        String kind,
        String fileName,
        String sourceUrl,
        String pathInZip,
        String storagePath,
        Long sizeBytes,
        Boolean pdfReadable,
        Integer pdfPages
) {}