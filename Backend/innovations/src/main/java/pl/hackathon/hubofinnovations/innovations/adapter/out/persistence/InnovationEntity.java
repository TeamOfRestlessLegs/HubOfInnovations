package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "innovations", uniqueConstraints = {@UniqueConstraint(columnNames = {"category_slug", "slug"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InnovationEntity {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_slug", referencedColumnName = "slug", nullable = false)
    private CategoryEntity category;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "short_description", columnDefinition = "TEXT")
    private String shortDescription;

    @Column(name = "description_md", columnDefinition = "TEXT")
    private String descriptionMd;

    @Column(name = "source_url", nullable = false)
    private String sourceUrl;

    @Column(name = "materials_url")
    private String materialsUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "scraped_at")
    private OffsetDateTime scrapedAt;

    @Column(name = "content_hash")
    private String contentHash;

    @OneToMany(mappedBy = "innovation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InnovationFileEntity> files = new ArrayList<>();
}