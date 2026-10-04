package pl.hackathon.hubofinnovations.innovations.adapter.in.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.IdeaInteractionUseCase;
import pl.hackathon.hubofinnovations.innovations.domain.port.in.dto.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class IdeaInteractionController {

    private final IdeaInteractionUseCase interactionUseCase;

    @GetMapping("/ideas/{id}/comments")
    public List<CommentDto> getComments(@PathVariable Long id, @RequestParam(defaultValue = "discussion") String section) {
        return interactionUseCase.getComments(id, section);
    }

    @PostMapping("/ideas/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentDto addComment(@PathVariable Long id, @RequestParam(defaultValue = "discussion") String section, @RequestBody CommentCommand command, @RequestHeader("X-User-Id") Long userId) {
        return interactionUseCase.addComment(id, section, command, userId);
    }

    @GetMapping("/ideas/{id}/questions")
    public List<QuestionDto> getQuestions(@PathVariable Long id) {
        return interactionUseCase.getQuestions(id);
    }

    @PostMapping("/ideas/{id}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionDto askQuestion(@PathVariable Long id, @RequestBody QuestionCommand command, @RequestHeader("X-User-Id") Long userId) {
        return interactionUseCase.askQuestion(id, command, userId);
    }

    @PostMapping("/questions/{questionId}/answers")
    @ResponseStatus(HttpStatus.CREATED)
    public AnswerDto answerQuestion(@PathVariable Long questionId, @RequestBody AnswerCommand command, @RequestHeader("X-User-Id") Long userId) {
        return interactionUseCase.answerQuestion(questionId, command, userId);
    }

    @GetMapping("/ideas/{id}/official-posts")
    public List<OfficialPostDto> getOfficialPosts(@PathVariable Long id) {
        return interactionUseCase.getOfficialPosts(id);
    }

    @PostMapping("/ideas/{id}/official-posts")
    @ResponseStatus(HttpStatus.CREATED)
    public OfficialPostDto addOfficialPost(@PathVariable Long id, @RequestBody OfficialPostCommand command, @RequestHeader("X-User-Id") Long userId) {
        return interactionUseCase.addOfficialPost(id, command, userId);
    }

    @PostMapping("/ideas/{id}/takeover-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public void requestTakeover(@PathVariable Long id, @RequestBody TakeoverRequestCommand command, @RequestHeader("X-User-Id") Long municipalityId) {
        interactionUseCase.requestTakeover(id, command, municipalityId);
    }

    @PostMapping("/takeover-requests/{requestId}/decision")
    public void takeoverDecision(@PathVariable Long requestId, @RequestBody TakeoverDecisionCommand command, @RequestHeader("X-User-Id") Long authorId) {
        interactionUseCase.takeoverDecision(requestId, command.accept(), authorId);
    }
}