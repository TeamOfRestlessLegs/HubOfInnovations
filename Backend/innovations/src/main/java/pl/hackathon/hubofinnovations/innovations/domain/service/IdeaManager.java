package pl.hackathon.hubofinnovations.innovations.domain.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import pl.hackathon.hubofinnovations.innovations.adapter.out.persistence.*;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.*;

import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
public class IdeaManager implements IdeaUseCase {

    private final SpringDataIdeaRepository ideaRepository;
    private final SpringDataSupportRepository supportRepository;
    private final SpringDataOfficialPostRepository postRepository; // Dodane repozytorium


    @Override
    public Page<IdeaDto> getIdeas(String query, Integer stage, String sort, Pageable pageable) {
        Specification<IdeaEntity> spec = Specification.where((root, cq, cb) ->
                cb.equal(root.get("status"), IdeaStatus.PUBLISHED)
        );

        if (query != null && !query.isBlank()) {
            String likePattern = "%" + query.toLowerCase() + "%";
            spec = spec.and((root, cq, cb) -> cb.or(
                    cb.like(cb.lower(root.get("title")), likePattern),
                    cb.like(cb.lower(root.get("problem")), likePattern),
                    cb.like(cb.lower(root.get("summary")), likePattern)
            ));
        }

        if (stage != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("stage"), stage));
        }

        return ideaRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Override
    public IdeaDto getIdea(Long id, Long userId) {
        return ideaRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fiszka nie znaleziona"));
    }

    @Override
    public Page<IdeaDto> getMyIdeas(Long userId, Pageable pageable) {
        return ideaRepository.findByAuthorIdOrLedById(userId, userId, pageable).map(this::toDto);
    }

    @Override
    public Page<IdeaDto> getFollowedIdeas(Long userId, Pageable pageable) {
        return ideaRepository.findIdeasSupportedByUser(userId, pageable).map(this::toDto);
    }

    @Override
    public Page<IdeaDto> getReviewQueue(Pageable pageable) {
        return ideaRepository.findByStatus(IdeaStatus.PENDING_REVIEW, pageable).map(this::toDto);
    }

    @Override
    public IdeaDto createIdea(CreateIdeaCommand command, Long userId) {
        IdeaEntity entity = IdeaEntity.builder()
                .authorId(userId)
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

        return toDto(ideaRepository.save(entity));
    }

    @Override
    public IdeaDto updateIdea(Long id, CreateIdeaCommand command, Long userId) {
        IdeaEntity idea = getIdeaEntityOrThrow(id);

        if (idea.getStatus() == IdeaStatus.REJECTED || idea.getStatus() == IdeaStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nie można edytować zamkniętej fiszki");
        }

        idea.setTitle(command.title());
        idea.setProblem(command.problem());
        idea.setCustomGroup(command.customGroup());
        idea.setSummary(command.summary());
        idea.setNovelty(command.novelty());

        if (idea.getStatus() == IdeaStatus.NEEDS_CHANGES) {
            idea.setStatus(IdeaStatus.PENDING_REVIEW);
        }

        return toDto(ideaRepository.save(idea));
    }

    @Override
    public IdeaDto endorseIdea(Long id, Long expertId) {
        IdeaEntity idea = getIdeaEntityOrThrow(id);
        idea.setStatus(IdeaStatus.PUBLISHED);
        idea.setEndorsedById(expertId);
        idea.setEndorsedAt(LocalDateTime.now());
        IdeaEntity saved = ideaRepository.save(idea);

        postRepository.save(OfficialPostEntity.builder()
                .ideaId(id).authorId(null).kind("status").event("published").body("Fiszka została zatwierdzona i opublikowana.").build());

        return toDto(saved);
    }

    @Override
    public IdeaDto requestChanges(Long id, ChangeRequestCommand command, Long expertId) {
        IdeaEntity idea = getIdeaEntityOrThrow(id);
        idea.setStatus(IdeaStatus.NEEDS_CHANGES);
        return toDto(ideaRepository.save(idea));
    }

    @Override
    public IdeaDto rejectIdea(Long id, String reason, Long adminId) {
        IdeaEntity idea = getIdeaEntityOrThrow(id);
        idea.setStatus(IdeaStatus.REJECTED);
        idea.setRejectReason(reason);
        IdeaEntity saved = ideaRepository.save(idea);

        postRepository.save(OfficialPostEntity.builder()
                .ideaId(id).authorId(null).kind("status").event("decision").body("Fiszka została odrzucona. Powód: " + reason).build());

        return toDto(saved);
    }

    @Override
    public IdeaDto archiveIdea(Long id, Long adminId) {
        IdeaEntity idea = getIdeaEntityOrThrow(id);
        idea.setStatus(IdeaStatus.ARCHIVED);
        IdeaEntity saved = ideaRepository.save(idea);

        postRepository.save(OfficialPostEntity.builder()
                .ideaId(id).authorId(null).kind("status").event("decision").body("Fiszka została zarchiwizowana.").build());

        return toDto(saved);
    }


    @Override
    public void requestStageChange(Long id, StageRequestCommand command, Long userId) {
        IdeaEntity idea = getIdeaEntityOrThrow(id);
        idea.setStageRequested(true);
        ideaRepository.save(idea);
    }

    @Override
    public void changeStage(Long id, Integer stage, Long adminOrMunicipalityId) {
        IdeaEntity idea = getIdeaEntityOrThrow(id);
        idea.setStage(stage);
        idea.setStageRequested(false);
        ideaRepository.save(idea);

        postRepository.save(OfficialPostEntity.builder()
                .ideaId(id).authorId(null).kind("status").event("stage").body("Etap projektu został zaktualizowany na: " + stage).build());
    }

    @Override
    public void rejectStageRequest(Long id, Long adminId) {
        IdeaEntity idea = getIdeaEntityOrThrow(id);
        idea.setStageRequested(false);
        ideaRepository.save(idea);
    }


    @Override
    public void supportIdea(Long id, Long userId) {
        SupportId supportId = new SupportId(id, userId);
        if (!supportRepository.existsById(supportId)) {
            supportRepository.save(new SupportEntity(id, userId, LocalDateTime.now()));
        }
    }

    @Override
    public void unsupportIdea(Long id, Long userId) {
        SupportId supportId = new SupportId(id, userId);
        supportRepository.deleteById(supportId);
    }

    @Override
    public List<IdeaDto> getIdeasByStatus(IdeaStatus status) {
        return ideaRepository.findByStatus(status)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private IdeaEntity getIdeaEntityOrThrow(Long id) {
        return ideaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fiszka o ID " + id + " nie znaleziona"));
    }

    private IdeaDto toDto(IdeaEntity entity) {
        return new IdeaDto(
                entity.getId(), entity.getAuthorId(), entity.getLedById(), entity.getByMunicipality(),
                entity.getProblem(), entity.getCustomGroup(), entity.getTitle(), entity.getSummary(),
                entity.getStage(), entity.getNovelty(), entity.getStatus(), entity.getRejectReason(),
                entity.getEndorsedById(), entity.getEndorsedAt(), entity.getStageRequested(),
                entity.getCreatedAt(), entity.getUpdatedAt()
        );
    }
}