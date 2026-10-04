package pl.hackathon.hubofinnovations.innovations.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.*;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaInteractionUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.InnovationUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.CategoryRepository;
import pl.hackathon.hubofinnovations.innovations.domain.port.out.InnovationRepository;
import pl.hackathon.hubofinnovations.innovations.domain.service.IdeaInteractionManager;
import pl.hackathon.hubofinnovations.innovations.domain.service.IdeaManager;
import pl.hackathon.hubofinnovations.innovations.domain.service.InnovationManager;

@Configuration
public class DomainConfig {

    @Bean
    public InnovationUseCase innovationUseCase(CategoryRepository categoryRepository, InnovationRepository innovationRepository) {
        return new InnovationManager(categoryRepository, innovationRepository);
    }

    @Bean
    public IdeaUseCase ideaUseCase(
            SpringDataIdeaRepository ideaRepository,
            SpringDataSupportRepository supportRepository,
            SpringDataOfficialPostRepository postRepository) {
        return new IdeaManager(ideaRepository, supportRepository, postRepository);
    }

    @Bean
    public IdeaInteractionUseCase ideaInteractionUseCase(
            SpringDataIdeaRepository ideaRepository,
            SpringDataCommentRepository commentRepository,
            SpringDataQuestionRepository questionRepository,
            SpringDataAnswerRepository answerRepository,
            SpringDataOfficialPostRepository postRepository,
            SpringDataTakeoverRequestRepository takeoverRepository) {
        return new IdeaInteractionManager(ideaRepository, commentRepository, questionRepository, answerRepository, postRepository, takeoverRepository);
    }
}