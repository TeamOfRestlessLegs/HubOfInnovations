package pl.hackathon.hubofinnovations.innovations.domain.port.in;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.*;

import java.util.List;

public interface IdeaUseCase {
    Page<IdeaDto> getIdeas(String query, Integer stage, String sort, Pageable pageable);
    IdeaDto getIdea(Long id, Long userId);
    Page<IdeaDto> getMyIdeas(Long userId, Pageable pageable);
    Page<IdeaDto> getFollowedIdeas(Long userId, Pageable pageable);
    Page<IdeaDto> getReviewQueue(Pageable pageable);

    IdeaDto createIdea(CreateIdeaCommand command, Long userId);
    IdeaDto updateIdea(Long id, CreateIdeaCommand command, Long userId);
    IdeaDto endorseIdea(Long id, Long expertId);
    IdeaDto requestChanges(Long id, ChangeRequestCommand command, Long expertId);
    IdeaDto rejectIdea(Long id, String reason, Long adminId);
    IdeaDto archiveIdea(Long id, Long adminId);

    void requestStageChange(Long id, StageRequestCommand command, Long userId);
    void changeStage(Long id, Integer stage, Long adminOrMunicipalityId);
    void rejectStageRequest(Long id, Long adminId);

    void supportIdea(Long id, Long userId);
    void unsupportIdea(Long id, Long userId);

    List<IdeaDto> getIdeasByStatus(IdeaStatus status);
}