package pl.hackathon.hubofinnovations.innovations.adapter.out.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.InnovationTesterRepository;

@Component
@RequiredArgsConstructor
public class InnovationTesterRepositoryAdapter implements InnovationTesterRepository {

    private final SpringDataInnovationTesterRepository repository;

    @Override
    public boolean exists(String innovationId) {
        return repository.existsByInnovationId(innovationId);
    }

    @Override
    public void saveTester(String innovationId) {
        InnovationTesterEntity entity = InnovationTesterEntity.builder()
                .innovationId(innovationId)
                .build();
        repository.save(entity);
    }
}