package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataInnovationTesterRepository extends JpaRepository<InnovationTesterEntity, Long> {
    boolean existsByInnovationId(String innovationId);
}