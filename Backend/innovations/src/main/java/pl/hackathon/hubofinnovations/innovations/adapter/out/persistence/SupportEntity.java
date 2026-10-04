package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "supports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@IdClass(SupportId.class)
public class SupportEntity {
    @Id
    @Column(name = "idea_id", nullable = false)
    private Long ideaId;

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}