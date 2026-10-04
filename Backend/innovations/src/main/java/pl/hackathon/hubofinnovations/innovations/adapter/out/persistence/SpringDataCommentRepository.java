package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpringDataCommentRepository extends JpaRepository<CommentEntity, Long> {
    List<CommentEntity> findByIdeaIdAndSection(Long ideaId, String section);
}