package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;

import java.util.List;

public interface SpringDataIdeaRepository extends JpaRepository<IdeaEntity, Long>, JpaSpecificationExecutor<IdeaEntity> {

    List<IdeaEntity> findByStatus(IdeaStatus status);

    Page<IdeaEntity> findByStatus(IdeaStatus status, Pageable pageable);

    Page<IdeaEntity> findByAuthorIdOrLedById(Long authorId, Long ledById, Pageable pageable);

    @Query("SELECT i FROM IdeaEntity i JOIN SupportEntity s ON i.id = s.ideaId WHERE s.userId = :userId")
    Page<IdeaEntity> findIdeasSupportedByUser(@Param("userId") Long userId, Pageable pageable);
}