package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataSupportRepository extends JpaRepository<SupportEntity, SupportId> {
}