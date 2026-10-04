package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.*;

@RestController
@RequestMapping("/api/ideas")
@RequiredArgsConstructor
public class IdeaController {

    private final IdeaUseCase ideaUseCase;

    @GetMapping
    public Page<IdeaDto> getIdeas(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer stage,
            @RequestParam(defaultValue = "supports") String sort,
            Pageable pageable) {
        return ideaUseCase.getIdeas(q, stage, sort, pageable);
    }

    @GetMapping("/{id}")
    public IdeaDto getIdea(@PathVariable Long id, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ideaUseCase.getIdea(id, userId);
    }

    @GetMapping("/mine")
    public Page<IdeaDto> getMyIdeas(@RequestHeader("X-User-Id") Long userId, Pageable pageable) {
        return ideaUseCase.getMyIdeas(userId, pageable);
    }

    @GetMapping("/followed")
    public Page<IdeaDto> getFollowedIdeas(@RequestHeader("X-User-Id") Long userId, Pageable pageable) {
        return ideaUseCase.getFollowedIdeas(userId, pageable);
    }

    @GetMapping("/review-queue")
    public Page<IdeaDto> getReviewQueue(Pageable pageable) {
        return ideaUseCase.getReviewQueue(pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IdeaDto createIdea(@RequestBody CreateIdeaCommand command, @RequestHeader("X-User-Id") Long userId) {
        return ideaUseCase.createIdea(command, userId);
    }

    @PatchMapping("/{id}")
    public IdeaDto updateIdea(@PathVariable Long id, @RequestBody CreateIdeaCommand command, @RequestHeader("X-User-Id") Long userId) {
        return ideaUseCase.updateIdea(id, command, userId);
    }

    @PostMapping("/{id}/endorse")
    public IdeaDto endorseIdea(@PathVariable Long id, @RequestHeader("X-User-Id") Long expertId) {
        return ideaUseCase.endorseIdea(id, expertId);
    }

    @PostMapping("/{id}/change-requests")
    public IdeaDto requestChanges(@PathVariable Long id, @RequestBody ChangeRequestCommand command, @RequestHeader("X-User-Id") Long expertId) {
        return ideaUseCase.requestChanges(id, command, expertId);
    }

    @PostMapping("/{id}/reject")
    public IdeaDto rejectIdea(@PathVariable Long id, @RequestBody RejectIdeaCommand command, @RequestHeader("X-User-Id") Long adminId) {
        return ideaUseCase.rejectIdea(id, command.reason(), adminId);
    }

    @PostMapping("/{id}/archive")
    public IdeaDto archiveIdea(@PathVariable Long id, @RequestHeader("X-User-Id") Long adminId) {
        return ideaUseCase.archiveIdea(id, adminId);
    }

    @PostMapping("/{id}/stage-request")
    public void requestStageChange(@PathVariable Long id, @RequestBody StageRequestCommand command, @RequestHeader("X-User-Id") Long userId) {
        ideaUseCase.requestStageChange(id, command, userId);
    }

    @PatchMapping("/{id}/stage")
    public void changeStage(@PathVariable Long id, @RequestBody Integer stage, @RequestHeader("X-User-Id") Long adminOrMunicipalityId) {
        ideaUseCase.changeStage(id, stage, adminOrMunicipalityId);
    }

    @DeleteMapping("/{id}/stage-request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectStageRequest(@PathVariable Long id, @RequestHeader("X-User-Id") Long adminId) {
        ideaUseCase.rejectStageRequest(id, adminId);
    }

    @PutMapping("/{id}/support")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supportIdea(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        ideaUseCase.supportIdea(id, userId);
    }

    @DeleteMapping("/{id}/support")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsupportIdea(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        ideaUseCase.unsupportIdea(id, userId);
    }
}