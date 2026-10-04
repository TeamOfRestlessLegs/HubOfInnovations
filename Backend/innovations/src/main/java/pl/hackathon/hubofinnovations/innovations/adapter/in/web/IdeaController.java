package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.CreateIdeaCommand;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.IdeaDto;

@RestController
@RequestMapping("/api/ideas")
@RequiredArgsConstructor
public class IdeaController {

    private final IdeaUseCase ideaUseCase;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IdeaDto submitIdea(@RequestBody CreateIdeaCommand command) {
        return ideaUseCase.createIdea(command);
    }

    @PatchMapping("/{id}/reject")
    public IdeaDto rejectIdea(@PathVariable Long id, @RequestBody String rejectReason) {
        return ideaUseCase.rejectIdea(id, rejectReason);
    }
}