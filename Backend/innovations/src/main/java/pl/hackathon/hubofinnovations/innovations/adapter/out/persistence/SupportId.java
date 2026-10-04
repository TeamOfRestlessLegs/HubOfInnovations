package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import lombok.*;
import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class SupportId implements Serializable {
    private Long ideaId;
    private Long userId;
}