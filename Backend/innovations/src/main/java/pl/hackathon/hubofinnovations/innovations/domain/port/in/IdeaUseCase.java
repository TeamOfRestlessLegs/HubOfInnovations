package pl.hackathon.hubofinnovations.innovations.domain.port.in;

import pl.hackathon.hubofinnovations.innovations.domain.model.IdeaStatus;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CreateIdeaCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.IdeaDto;

import java.util.List;

public interface IdeaUseCase {
    IdeaDto createIdea(CreateIdeaCommand command);
    IdeaDto rejectIdea(Long id, String reason);
    List<IdeaDto> getIdeasByStatus(IdeaStatus status);
}