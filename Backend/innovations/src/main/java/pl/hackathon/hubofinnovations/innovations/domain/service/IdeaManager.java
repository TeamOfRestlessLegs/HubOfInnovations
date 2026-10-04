package pl.hackathon.hubofinnovations.innovations.domain.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CreateIdeaCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.IdeaDto;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.IdeaEntity;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.SpringDataIdeaRepository;

import java.util.List;

@RequiredArgsConstructor
public class IdeaManager implements IdeaUseCase {

    private final SpringDataIdeaRepository repository;

    @Override
    public IdeaDto createIdea(CreateIdeaCommand command) {
        IdeaEntity entity = IdeaEntity.builder()
                .authorId(command.authorId())
                .byMunicipality(command.byMunicipality() != null ? command.byMunicipality() : false)
                .title(command.title())
                .problem(command.problem())
                .customGroup(command.customGroup())
                .summary(command.summary())
                .novelty(command.novelty())
                .stage(1)
                .status(IdeaStatus.PENDING_REVIEW)
                .stageRequested(false)
                .build();

        IdeaEntity savedEntity = repository.save(entity);
        return toDto(savedEntity);
    }

    @Override
    public IdeaDto rejectIdea(Long id, String reason) {
        IdeaEntity idea = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fiszka o ID " + id + " nie została znaleziona"));

        idea.setStatus(IdeaStatus.REJECTED);
        idea.setRejectReason(reason);

        IdeaEntity updatedEntity = repository.save(idea);
        return toDto(updatedEntity);
    }

    @Override
    public List<IdeaDto> getIdeasByStatus(IdeaStatus status) {
        return repository.findByStatus(status)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private IdeaDto toDto(IdeaEntity entity) {
        return new IdeaDto(
                entity.getId(),
                entity.getAuthorId(),
                entity.getLedById(),
                entity.getByMunicipality(),
                entity.getProblem(),
                entity.getCustomGroup(),
                entity.getTitle(),
                entity.getSummary(),
                entity.getStage(),
                entity.getNovelty(),
                entity.getStatus(),
                entity.getRejectReason(),
                entity.getEndorsedById(),
                entity.getEndorsedAt(),
                entity.getStageRequested(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}