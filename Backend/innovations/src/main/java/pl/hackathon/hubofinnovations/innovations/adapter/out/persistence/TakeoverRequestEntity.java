package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "takeover_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TakeoverRequestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idea_id", nullable = false)
    private Long ideaId;

    @Column(name = "municipality_id", nullable = false)
    private Long municipalityId;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private String status = "pending";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;
}