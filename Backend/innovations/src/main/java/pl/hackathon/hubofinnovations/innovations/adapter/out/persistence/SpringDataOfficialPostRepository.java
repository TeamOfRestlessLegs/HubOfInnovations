package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpringDataOfficialPostRepository extends JpaRepository<OfficialPostEntity, Long> {
    List<OfficialPostEntity> findByIdeaId(Long ideaId);
}