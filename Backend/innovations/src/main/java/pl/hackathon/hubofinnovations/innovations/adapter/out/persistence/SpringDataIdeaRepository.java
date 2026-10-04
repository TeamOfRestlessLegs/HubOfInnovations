package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;

import java.util.List;

public interface SpringDataIdeaRepository extends JpaRepository<IdeaEntity, Long> {
    List<IdeaEntity> findByStatus(IdeaStatus status);
    List<IdeaEntity> findByAuthorId(Long authorId);
}