package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpringDataInnovationRepository extends JpaRepository<InnovationEntity, String> {
    Page<InnovationEntity> findByCategorySlug(String categorySlug, Pageable pageable);
    List<InnovationEntity> findByCategorySlug(String categorySlug);
    long countByCategorySlug(String categorySlug);
}