package pl.hackathon.hubofinnovations.innovations.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.SpringDataIdeaRepository;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.InnovationUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.CategoryRepository;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.InnovationRepository;
import pl.hackathon.hubofinnovations.innovations.domain.service.IdeaManager;
import pl.hackathon.hubofinnovations.innovations.domain.service.InnovationManager;

@Configuration
public class DomainConfig {

    @Bean
    public InnovationUseCase innovationUseCase(CategoryRepository categoryRepository, InnovationRepository innovationRepository) {
        return new InnovationManager(categoryRepository, innovationRepository);
    }

    @Bean
    public IdeaUseCase ideaUseCase(SpringDataIdeaRepository repository) {
        return new IdeaManager(repository);
    }
}