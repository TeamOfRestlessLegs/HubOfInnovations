package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataAnswerRepository extends JpaRepository<AnswerEntity, Long> {
}