package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "official_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficialPostEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idea_id", nullable = false)
    private Long ideaId;

    @Column(name = "author_id")
    private Long authorId;

    @Column(nullable = false)
    private String kind;

    @Column(nullable = false)
    @Builder.Default
    private String event = "other";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}