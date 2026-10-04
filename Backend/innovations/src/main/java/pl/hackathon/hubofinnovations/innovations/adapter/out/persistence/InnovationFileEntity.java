package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "innovation_files")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InnovationFileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "innovation_id", nullable = false)
    private InnovationEntity innovation;

    @Column(name = "kind", nullable = false)
    private String kind;

    @Column(name = "file_name", nullable = false, columnDefinition = "TEXT")
    private String fileName;

    @Column(name = "source_url", columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(name = "path_in_zip", columnDefinition = "TEXT")
    private String pathInZip;

    @Column(name = "storage_path", columnDefinition = "TEXT")
    private String storagePath;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "pdf_readable")
    private Boolean pdfReadable;

    @Column(name = "pdf_pages")
    private Integer pdfPages;
}
