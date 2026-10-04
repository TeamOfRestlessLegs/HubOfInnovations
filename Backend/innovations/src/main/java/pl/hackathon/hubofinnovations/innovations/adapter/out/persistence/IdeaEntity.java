package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "ideas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdeaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(name = "led_by_id")
    private Long ledById;

    @Column(name = "by_municipality", nullable = false)
    @Builder.Default
    private Boolean byMunicipality = false;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String problem;

    @Column(name = "custom_group", length = 200)
    private String customGroup;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false)
    @Builder.Default
    private Integer stage = 1;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String novelty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private IdeaStatus status = IdeaStatus.PENDING_REVIEW;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "endorsed_by_id")
    private Long endorsedById;

    @Column(name = "endorsed_at")
    private LocalDateTime endorsedAt;

    @Column(name = "stage_requested", nullable = false)
    @Builder.Default
    private Boolean stageRequested = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}