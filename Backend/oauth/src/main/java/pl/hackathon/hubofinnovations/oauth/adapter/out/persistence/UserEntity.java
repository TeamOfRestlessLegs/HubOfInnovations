package pl.hackathon.hubofinnovations.oauth.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;
import pl.hackathon.hubofinnovations.oauth.domain.model.Role;

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {

    @Id
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
}